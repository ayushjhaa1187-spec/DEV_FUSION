'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { mentorApi, bookingApi } from '@/lib/api';
import styles from './profile.module.css';
import confetti from 'canvas-confetti';

interface MentorProfile {
  id: string;
  user_id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  reputation_points?: number;
  mentor_profiles?: {
    specialty: string;
    price_per_session: number;
    rating: number;
    sessions_completed: number;
    skills?: string[];
    bio?: string;
  };
}

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export default function MentorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { id } = use(params);
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'badges'>('about');

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileData, slotsData] = await Promise.all([
          mentorApi.getProfile(id),
          mentorApi.getSlots(id)
        ]);
        setProfile(profileData);
        setSlots(slotsData);

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
    const slot = slots.find((s) => s.id === selectedSlot);
    const fee = profile?.mentor_profiles?.price_per_session || 0;
    setBookingLoading(true);
    try {
      if (fee > 0) {
        const res = await loadRazorpay();
        if (!res) throw new Error('Razorpay SDK failed to load');
        const orderData = await fetch('/api/razorpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: fee, mentor_id: id, slot_id: selectedSlot })
        }).then((t) => t.json());
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: 'INR',
          name: 'SkillBridge Mentor',
          description: `Booking with ${profile?.full_name}`,
          order_id: orderData.id,
          handler: async function (response: any) {
            await bookingApi.create({
              slot_id: selectedSlot,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            } as any);
            setSuccess(true);
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#7c3aed', '#06d6a0', '#ffffff']
            });
            setTimeout(() => window.location.href = '/dashboard/sessions', 3000);
          },
          prefill: { name: user.email?.split('@')[0], email: user.email },
          theme: { color: '#7c3aed' }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        await bookingApi.create({ slot_id: selectedSlot });
        setSuccess(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7c3aed', '#06d6a0', '#ffffff']
        });
        setTimeout(() => window.location.href = '/dashboard/sessions', 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Booking failed');
    } finally {
      if (fee === 0) setBookingLoading(false);
    }
  };

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.pulse}>Syncing Mentor Availability...</div>
    </div>
  );
  if (!profile) return (
    <div className={styles.container}>
      <h2>Mentor Not Found</h2>
    </div>
  );

  const skills = profile.mentor_profiles?.skills || [];
  const reputation = profile.reputation_points || 0;
  const rating = profile.mentor_profiles?.rating || 0;
  const sessions = profile.mentor_profiles?.sessions_completed || 0;

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
            <span>⭐ {rating.toFixed(1)}</span>
            <span>📅 {sessions} Sessions</span>
            <span className={styles.repBadge}>Rep: {reputation}</span>
          </div>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'about' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'reviews' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'badges' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          Badges
        </button>
      </div>

      <div className={styles.contentGrid}>
        <main className={styles.mainContent}>
          {activeTab === 'about' && (
            <>
              <section className={`${styles.card} glass`}>
                <h3>Bio</h3>
                <p className={styles.bio}>{profile.bio || "This mentor is ready to help you excel!"}</p>
              </section>
              {skills.length > 0 && (
                <section className={`${styles.card} glass`}>
                  <h3>Skills & Expertise</h3>
                  <div className={styles.skillsGrid}>
                    {skills.map((skill, idx) => (
                      <span key={idx} className={styles.skillTag}>{skill}</span>
                    ))}
                  </div>
                </section>
              )}
              <section className={`${styles.card} glass`}>
                <h3>Teaching Style</h3>
                <div className={styles.teachingStyle}>
                  <div className={styles.styleItem}>
                    <span className={styles.styleIcon}>🎯</span>
                    <div>
                      <strong>Personalized</strong>
                      <p>Tailors approach to each student's learning pace</p>
                    </div>
                  </div>
                  <div className={styles.styleItem}>
                    <span className={styles.styleIcon}>💬</span>
                    <div>
                      <strong>Interactive</strong>
                      <p>Encourages questions and active participation</p>
                    </div>
                  </div>
                  <div className={styles.styleItem}>
                    <span className={styles.styleIcon}>📊</span>
                    <div>
                      <strong>Results-Oriented</strong>
                      <p>Focuses on measurable improvement</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
          {activeTab === 'reviews' && (
            <section className={`${styles.card} glass`}>
              <h3>Reviews</h3>
              <div className={styles.reviewsContainer}>
                <div className={styles.reviewSummary}>
                  <div className={styles.avgRating}>
                    <span className={styles.bigRating}>{rating.toFixed(1)}</span>
                    <div className={styles.stars}>{'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}</div>
                    <span className={styles.reviewCount}>Based on {sessions} sessions</span>
                  </div>
                </div>
                <div className={styles.reviewList}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={styles.reviewItem}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewAvatar}>U{i}</div>
                        <div>
                          <strong>Student {i}</strong>
                          <div className={styles.reviewStars}>
                            {'★'.repeat(5)}
                          </div>
                        </div>
                        <span className={styles.reviewDate}>2 days ago</span>
                      </div>
                      <p className={styles.reviewText}>
                        Excellent mentor! Very patient and explains concepts clearly. Helped me improve my grade significantly.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
          {activeTab === 'badges' && (
            <section className={`${styles.card} glass`}>
              <h3>Badges & Achievements</h3>
              <div className={styles.badgesGrid}>
                {reputation >= 2 && (
                  <div className={styles.badge}>
                    <span className={styles.badgeIcon}>🎓</span>
                    <span className={styles.badgeName}>First Answer</span>
                    <span className={styles.badgeDesc}>Posted first answer</span>
                  </div>
                )}
                {reputation >= 25 && (
                  <div className={styles.badge}>
                    <span className={styles.badgeIcon}>🤝</span>
                    <span className={styles.badgeName}>Helper</span>
                    <span className={styles.badgeDesc}>25+ reputation points</span>
                  </div>
                )}
                {reputation >= 100 && (
                  <div className={styles.badge}>
                    <span className={styles.badgeIcon}>⭐</span>
                    <span className={styles.badgeName}>Rising Star</span>
                    <span className={styles.badgeDesc}>100+ reputation points</span>
                  </div>
                )}
                {reputation >= 500 && (
                  <div className={styles.badge}>
                    <span className={styles.badgeIcon}>🏆</span>
                    <span className={styles.badgeName}>Expert</span>
                    <span className={styles.badgeDesc}>500+ reputation points</span>
                  </div>
                )}
                {reputation >= 1000 && (
                  <div className={styles.badge}>
                    <span className={styles.badgeIcon}>👑</span>
                    <span className={styles.badgeName}>Legend</span>
                    <span className={styles.badgeDesc}>1000+ reputation points</span>
                  </div>
                )}
                {sessions >= 10 && (
                  <div className={styles.badge}>
                    <span className={styles.badgeIcon}>📚</span>
                    <span className={styles.badgeName}>Dedicated Mentor</span>
                    <span className={styles.badgeDesc}>{sessions}+ sessions completed</span>
                  </div>
                )}
              </div>
            </section>
          )}
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
                {slots.length > 0 ? (
                  slots.map((slot) => (
                    <button
                      key={slot.id}
                      className={`${styles.slotBtn} ${selectedSlot === slot.id ? styles.selected : ''} ${slot.is_booked ? styles.booked : ''}`}
                      onClick={() => !slot.is_booked && setSelectedSlot(slot.id)}
                      disabled={slot.is_booked}
                    >
                      <span className={styles.slotDay}>
                        {new Date(slot.start_time).toLocaleDateString([], { weekday: 'short' })}
                      </span>
                      <span className={styles.slotTime}>
                        {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {slot.is_booked && <span className={styles.bookedTag}>Booked</span>}
                    </button>
                  ))
                ) : (
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
          </div>
        </aside>
      </div>
    </div>
  );
}
