'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { mentorApi, bookingApi } from '@/lib/api';
import styles from './profile.module.css';

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
  const [success, setSuccess] = useState(false);
  
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileData, slotsData] = await Promise.all([
          mentorApi.getProfile(id),
          mentorApi.getSlots(id)
        ]);
        setProfile(profileData);
        setSlots(slotsData);
        
        // Check follow status
        if (user) {
          const followRes = await fetch(`/api/mentors/${id}/follow`);
          const { following } = await followRes.json();
          setFollowing(following);
        }
      } catch (err) {
        console.error('Failed to load mentor profile', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, user]);

  const handleFollow = async () => {
    if (!user) return alert('Please log in to follow mentors.');
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/mentors/${id}/follow`, { method: 'POST' });
      const { following: newFollowing } = await res.json();
      setFollowing(newFollowing);
    } catch (err) {
      alert('Follow action failed');
    } finally {
      setFollowLoading(false);
    }
  };

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

    const slot = slots.find(s => s.id === selectedSlot);
    const fee = profile.mentor_profiles?.hourly_rate || 0;

    setBookingLoading(true);
    try {
      if (fee > 0) {
        const res = await loadRazorpay();
        if (!res) throw new Error('Razorpay SDK failed to load');

        // 1. Create Order
        const orderData = await fetch('/api/razorpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: fee, mentor_id: id, slot_id: selectedSlot }),
        }).then(t => t.json());

        // 2. Open Checkout
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: 'INR',
          name: 'SkillBridge Mentor',
          description: `Booking with ${profile.full_name}`,
          order_id: orderData.id,
          handler: async function (response: any) {
            // 3. Confirm Booking
            await bookingApi.create({ slot_id: selectedSlot });
            setSuccess(true);
            setTimeout(() => window.location.href = '/dashboard', 2000);
          },
          prefill: {
            name: user.email?.split('@')[0],
            email: user.email,
          },
          theme: { color: '#7c3aed' }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Free booking
        await bookingApi.create({ slot_id: selectedSlot });
        setSuccess(true);
        setTimeout(() => window.location.href = '/dashboard', 2000);
      }
    } catch (err: any) {
      alert(err.message || 'Booking failed');
    } finally {
      if (fee === 0) setBookingLoading(false);
    }
  };

  if (loading) return <div className={styles.container}><div className={styles.pulse}>Syncing Mentor Availability...</div></div>;
  if (!profile) return <div className={styles.container}><h2>Mentor Not Found</h2></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.avatarWrap}>
          <img 
            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
            className={styles.avatar}
            alt={profile.full_name}
          />
        </div>
        <div className={styles.info}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className={styles.name}>{profile.full_name || profile.username}</h1>
              <p className={styles.specialty}>{profile.mentor_profiles?.specialty || 'Academic Mentor'}</p>
            </div>
            <button 
              className={`${styles.followBtn} ${following ? styles.following : ''}`} 
              onClick={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? '...' : following ? '✓ Following' : '+ Follow Mentor'}
            </button>
          </div>
          <div className={styles.statsRow}>
            <span>⭐ {profile.mentor_profiles?.rating || '5.0'}</span>
            <span>📅 {profile.mentor_profiles?.sessions_completed || 0} Sessions</span>
            <span className={styles.repBadge}>Rep: {profile.reputation_points}</span>
          </div>
        </div>
      </header>

      <div className={styles.contentGrid}>
        <main className={styles.mainContent}>
          <section className={`${styles.card} glass`}>
            <h3>Expertise & Skills</h3>
            <div className={styles.tags}>
               <span className={styles.tag}>{profile.mentor_profiles?.specialty}</span>
               {/* Expertise areas could be added here if available */}
            </div>
            <h3>Bio</h3>
            <p className={styles.bio}>{profile.bio || "This mentor hasn't provided a bio yet, but they're ready to help you excel!"}</p>
          </section>
        </main>

        <aside className={styles.sideContent}>
          <div className={`${styles.bookingCard} glass`}>
            <div className={styles.priceHeader}>
              <span className={styles.price}>₹{profile.mentor_profiles?.price_per_session || 0}</span>
              <span className={styles.duration}>/ 30 min session</span>
            </div>

            <div className={styles.slotPicker}>
              <h4>Select a Live Slot</h4>
              <div className={styles.slotGrid}>
                {slots.length > 0 ? slots.map(slot => (
                  <button 
                    key={slot.id} 
                    className={`${styles.slotBtn} ${selectedSlot === slot.id ? styles.selected : ''}`}
                    onClick={() => setSelectedSlot(slot.id)}
                  >
                    <span className={styles.slotDay}>{new Date(slot.start_time).toLocaleDateString([], { weekday: 'short' })}</span>
                    <span className={styles.slotTime}>{new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </button>
                )) : (
                  <p className={styles.emptySlots}>No public slots available right now.</p>
                )}
              </div>
            </div>

            <button 
              className={styles.bookBtn}
              onClick={handleBooking}
              disabled={bookingLoading || !selectedSlot || success}
            >
              {success ? '✅ Session Booked!' : bookingLoading ? 'Reserving...' : 'Book Now'}
            </button>
            {success && <p className={styles.successMsg}>Redirecting to your dashboard...</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
