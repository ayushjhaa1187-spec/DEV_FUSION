'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { mentorApi, bookingApi } from '@/lib/api';
import ReputationBadge from '@/components/user/ReputationBadge';
import styles from './profile.module.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function MentorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const { id } = use(params);
  const [profile, setProfile] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileData, slotsData] = await Promise.all([
          mentorApi.getProfile(id),
          mentorApi.getSlots(id)
        ]);
        setProfile(profileData);
        setSlots(slotsData);
      } catch (err) {
        console.error('Failed to load mentor profile');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBooking = async () => {
    if (!selectedSlot) return alert('Please select a time slot.');
    if (!user) return alert('Please log in to book a session.');

    setBookingLoading(true);
    try {
      const { booking, razorpayOrder } = await bookingApi.create({
        mentorId: id,
        slotId: selectedSlot
      });

      if (booking.paymentStatus === 'free') {
          // Verify directly for free bookings
          await bookingApi.verify({ bookingId: booking._id });
          alert('Session booked successfully (Free)!');
          window.location.reload();
          return;
      }

      // Paid booking
      const res = await loadRazorpay();
      if (!res) throw new Error('Razorpay SDK failed to load');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'SkillBridge',
        description: `Mentorship session with ${profile.userId.name}`,
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          try {
            await bookingApi.verify({
              bookingId: booking._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            alert('Payment successful & Session booked!');
            window.location.reload();
          } catch (err) {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#3b82f6'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading profile...</div>;
  if (!profile) return <div className={styles.errorBanner}>Mentor not found.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.headerMain}>
          <div className={styles.avatarGlow}>
            <div className={styles.avatarPlaceholder} />
          </div>
          <div className={styles.info}>
            <h1 className={styles.name}>{profile.userId?.name}</h1>
            <p className={styles.specialty}>{profile.subjects?.join(' • ')}</p>
            <ReputationBadge points={profile.userId?.reputation || 0} showBadges />
          </div>
        </div>
        <div className={styles.quickStats}>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{profile.avgRating || '5.0'} ★</span>
            <span className={styles.statLab}>Rating</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{profile.totalSessions}+</span>
            <span className={styles.statLab}>Sessions</span>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.leftCol}>
          <section className={`${styles.section} glass`}>
            <h3>About</h3>
            <p>{profile.bio}</p>
          </section>
          
          <section className={`${styles.section} glass`}>
            <h3>Specialties</h3>
            <div className={styles.skills}>
              {profile.subjects?.map((skill: string) => <span key={skill} className={styles.skillTag}>{skill}</span>)}
            </div>
          </section>
        </div>

        <div className={styles.rightCol}>
          <section className={`${styles.bookingCard} glass`}>
            <h3>Book a Session</h3>
            <p className={styles.priceLine}>
              <span className={styles.price}>{profile.fee === 0 ? 'Free' : `₹${profile.fee}`}</span> / 30 mins
            </p>
            
            <div className={styles.slots}>
              {slots.map(slot => (
                <button 
                  key={slot._id} 
                  className={`${styles.slotBtn} ${slot.status !== 'open' ? styles.booked : ''} ${selectedSlot === slot._id ? styles.selected : ''}`}
                  disabled={slot.status !== 'open'}
                  onClick={() => setSelectedSlot(slot._id)}
                >
                  {new Date(slot.startAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                  {slot.status !== 'open' && <span className={styles.bookedLabel}>Booked</span>}
                </button>
              ))}
              {slots.length === 0 && <p className={styles.noSlots}>No available slots found.</p>}
            </div>
            
            <button 
              className={styles.mainBookBtn} 
              onClick={handleBooking}
              disabled={bookingLoading || !selectedSlot}
            >
              {bookingLoading ? 'Processing...' : 'Confirm Booking'}
            </button>
            <p className={styles.note}>Sandbox payment will be triggered</p>
          </section>
        </div>
      </div>
    </div>
  );
}
