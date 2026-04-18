'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { mentorApi, bookingApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Users, Clock, ShieldCheck, MapPin, 
  ChevronRight, Calendar, Award, MessageSquare,
  CheckCircle2, IndianRupee, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface MentorProfile {
  id: string;
  user_id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  reputation_points?: number;
  session_fee?: number;
  mentor_profiles?: {
    specialty: string;
    hourly_rate: number;
    rating_avg: number;
    rating_count: number;
    sessions_completed: number;
    subjects?: string[];
  };
}

interface Review {
  id: string;
  review_text: string;
  review_rating: number;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export default function MentorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { id } = use(params);
  
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<{id: string, start_time: string}[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'badges'>('about');

  const REVIEWS_LIMIT = 5;

  useEffect(() => {
    async function fetchData() {
      try {
        const profileData = await mentorApi.getProfile(id);
        const reviewsData = await mentorApi.getReviews(id, REVIEWS_LIMIT, 0).catch(() => ({ reviews: [], total: 0 }));
        
        setProfile(profileData);
        setReviews(reviewsData.reviews || []);
        setTotalReviews(reviewsData.total || 0);

        // Fetch initial slots
        fetchSlots(profileData.id, new Date().toISOString().split('T')[0]);
      } catch (err) {
        console.error('Failed to load mentor data', err);
        toast.error('Failed to load mentor profile');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const fetchSlots = async (mentorId: string, date: string) => {
      try {
          const res = await mentorApi.getSlots(mentorId, date);
          if (res && Array.isArray(res.slots)) {
              setSlots(res.slots);
          } else {
              setSlots([]);
          }
      } catch (err) {
          console.error(err);
          setSlots([]);
      }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTargetDate(e.target.value);
      if (profile?.id) {
          fetchSlots(profile.id, e.target.value);
          setSelectedSlotId(null);
      }
  };

  const fetchMoreReviews = async (page: number) => {
    setReviewsLoading(true);
    try {
      const data = await mentorApi.getReviews(id, REVIEWS_LIMIT, page * REVIEWS_LIMIT).catch(() => ({ reviews: [] }));
      setReviews(data.reviews || []);
      setReviewPage(page);
    } catch (err) {
      toast.error('Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlotId) return toast.error('Please select a time slot');
    if (!user) return toast.error('Please log in to book a session');
    
    setBookingLoading(true);

    try {
      // 1. Initiate Order
      const initRes = await bookingApi.initiate({ mentor_id: id, slot_id: selectedSlotId });
      
      if (initRes.status === 'confirmed') {
        setSuccess(true);
        triggerConfetti();
        toast.success('Zero-fee session booked successfully!');
        setTimeout(() => window.location.href = '/dashboard/sessions', 2000);
        return;
      }

      // Paid Session Flow using Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_123',
        amount: initRes.amount,
        currency: "INR",
        name: "SkillBridge Mentorship",
        description: `Session with ${profile?.full_name ?? 'Mentor'}`,
        order_id: initRes.order_id,
        handler: async (response: any) => {
          try {
            // 2. Verify Payment
            await bookingApi.verifyPayment({
              booking_id: initRes.booking_id,
              razorpay_order_id: response.razorpay_order_id || initRes.order_id,
              razorpay_payment_id: response.razorpay_payment_id || 'sim',
              razorpay_signature: response.razorpay_signature || 'sim',
            });

            setSuccess(true);
            triggerConfetti();
            toast.success('Session booked successfully!');
            setTimeout(() => window.location.href = '/dashboard/sessions', 2000);
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || user.email,
          email: user.email,
        },
        theme: { color: "#6366f1" }, // indigo-600
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast.error('Payment failed: ' + response.error.description);
      });
      rzp.open();

    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#10b981', '#ffffff'] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-indigo-400 font-black uppercase tracking-widest text-xs">Syncing Mentor Node...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#06060f] flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-black mb-4">Mentor Not Found</h2>
          <p className="text-gray-500">The requested mentor profile does not exist or has been deactivated.</p>
        </div>
      </div>
    );
  }

  const mentorInfo = profile.mentor_profiles;
  const rating = mentorInfo?.rating_avg || 0;
  const sessionCount = mentorInfo?.sessions_completed || 0;
  const displayFee = profile.session_fee !== undefined ? profile.session_fee : (mentorInfo?.hourly_rate || 250);

  return (
    <main className="min-h-screen bg-[#06060f] selection:bg-indigo-500/30 text-white pb-24">
      {/* Hero Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-indigo-900 via-indigo-950 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06060f] to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Header Profile Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0c0c16]/80 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center md:items-start gap-8"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-4 border-[#0c0c16] shadow-2xl bg-indigo-600/20 flex-shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.full_name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black text-indigo-400">
                    {profile.username?.[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none mb-2">
                      {profile.full_name || `@${profile.username}`}
                    </h1>
                    <p className="text-indigo-400 font-black uppercase text-xs tracking-[0.2em]">
                      {mentorInfo?.specialty || 'Expert Academic Mentor'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center md:justify-end gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                    <Star className="text-amber-400 fill-amber-400" size={18} />
                    <span className="text-lg font-black">{rating.toFixed(1)}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase ml-1">Avg Rating</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-indigo-500" />
                    <span>{sessionCount} Sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>Verified Expert</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 p-1.5 bg-white/5 rounded-[2rem] border border-white/5 w-fit">
              <button 
                onClick={() => setActiveTab('about')}
                className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === 'about' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Profile & Bio
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === 'reviews' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                 Student Reviews ({totalReviews})
              </button>
              <button 
                onClick={() => setActiveTab('badges')}
                className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === 'badges' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Achievements
              </button>
            </div>

            {/* Tab Panels */}
            <AnimatePresence mode="wait">
              {activeTab === 'about' && (
                <motion.div 
                  key="about"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  <div className="bg-[#0c0c16]/50 p-8 rounded-[3rem] border border-white/5 group">
                    <h3 className="text-xs font-black uppercase text-indigo-500 tracking-widest mb-6 flex items-center gap-2">
                      <MessageSquare size={14} /> Academic Philosophy
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed font-medium italic">
                      "{profile.bio || "Optimization in progress. This mentor is dedicated to providing high-fidelity conceptual clarity for all students."}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                      <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-6">Expertise Nodes</h3>
                      <div className="flex flex-wrap gap-2">
                        {mentorInfo?.subjects?.map((s: string) => (
                           <span key={s} className="px-4 py-2 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-tight rounded-xl border border-indigo-500/20">
                           {s}
                         </span>
                        )) || <span className="text-gray-600 italic">General Studies</span>}
                      </div>
                    </div>
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                      <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-6">Teaching Style</h3>
                      <div className="space-y-3">
                         <div className="flex items-center gap-3 text-sm font-bold text-gray-300">
                           <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">⚡</div>
                            Adaptive & Fast-paced
                         </div>
                         <div className="flex items-center gap-3 text-sm font-bold text-gray-300">
                           <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">🧠</div>
                            Conceptual Depth
                         </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div 
                  key="reviews"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black">Latest Transmissions</h3>
                    <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">
                       Showing {reviews.length} of {totalReviews}
                    </div>
                  </div>

                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-[#0c0c16]/50 p-8 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white/5">
                                {review.profiles.avatar_url ? (
                                  <img src={review.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full bg-indigo-600 flex items-center justify-center font-black text-white uppercase">
                                    {review.profiles.username?.[0]}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-black text-white text-sm uppercase tracking-tight">{review.profiles.full_name || review.profiles.username}</p>
                                <div className="flex gap-0.5 mt-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      size={10} 
                                      className={i < review.review_rating ? 'fill-amber-400 text-amber-400' : 'text-gray-700'} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-400 leading-relaxed font-medium">
                            "{review.review_text}"
                          </p>
                        </div>
                      ))}

                      {totalReviews > REVIEWS_LIMIT && (
                        <div className="flex justify-center gap-4 pt-4">
                          <button 
                            disabled={reviewPage === 0 || reviewsLoading}
                            onClick={() => fetchMoreReviews(reviewPage - 1)}
                            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                          >
                            Previous
                          </button>
                          <button 
                            disabled={(reviewPage + 1) * REVIEWS_LIMIT >= totalReviews || reviewsLoading}
                            onClick={() => fetchMoreReviews(reviewPage + 1)}
                            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                          >
                            {reviewsLoading ? 'Loading...' : 'Next'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-white/2 rounded-[3rem] border border-dashed border-white/5 text-gray-600 font-bold uppercase text-[10px] tracking-[0.2em]">
                      No review logs found in current sector
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'badges' && (
                <motion.div 
                  key="badges"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {[
                    { id: '1', title: 'Top Rated', icon: '💎', desc: 'Consistently 5-star rating' },
                    { id: '2', title: 'Expert', icon: '🎓', desc: 'Subject matter authority' },
                    { id: '3', title: 'Elite', icon: '🔥', desc: '100+ sessions completed' },
                    { id: '4', title: 'Legacy', icon: '🏆', desc: 'SkillBridge Founding Mentor' },
                  ].map((badge) => (
                    <div key={badge.id} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex flex-col items-center text-center group hover:bg-white/10 transition-all">
                       <span className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all block filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                         {badge.icon}
                       </span>
                       <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">{badge.title}</p>
                       <p className="text-[9px] text-gray-500 font-bold">{badge.desc}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Booking Sidebar (Right) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-6">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-gradient-to-br from-[#0c0c16] to-[#06060f] p-8 rounded-[3rem] border-2 border-indigo-500/20 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] p-8 text-center mb-10 group hover:bg-indigo-500/20 transition-all">
                <div className="flex items-center justify-center gap-2 text-5xl font-black text-white mb-2">
                   <IndianRupee size={32} className="text-indigo-400" />
                   {displayFee}
                </div>
                <p className="text-[10px] text-indigo-400/60 font-black uppercase tracking-[0.2em]">Contribution per 30-min Synapse</p>
              </div>

              <div className="space-y-4 mb-10">
                <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex justify-between items-center">
                  <span>Select Live Slot</span>
                  <input 
                      type="date" 
                      value={targetDate}
                      onChange={handleDateChange}
                      className="bg-black/50 text-white rounded outline-none px-2 py-1 border border-white/10"
                      min={new Date().toISOString().split('T')[0]}
                  />
                </h4>

                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {slots.length > 0 ? (
                    slots.map((slot) => (
                      <button
                        key={slot.id}
                        disabled={bookingLoading}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-4 rounded-2xl border transition-all text-left flex flex-col relative overflow-hidden ${
                          selectedSlotId === slot.id 
                            ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-600/20 text-white' 
                            : 'bg-white/5 border-white/5 hover:border-indigo-500/30 text-gray-400'
                        }`}
                      >
                         <p className="text-[9px] font-black uppercase opacity-60">
                           {new Date(slot.start_time).toLocaleDateString([], { weekday: 'short' })}
                         </p>
                         <p className="text-sm font-black">
                           {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 py-8 text-center text-gray-600 text-[10px] font-black uppercase border border-dashed border-white/5 rounded-2xl">
                       No open frequencies
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={bookingLoading || !selectedSlotId || success}
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  success 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-white text-black hover:bg-gray-100 shadow-xl shadow-white/5 disabled:opacity-30'
                }`}
              >
                {bookingLoading ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : success ? (
                  <><CheckCircle2 size={16} /> Frequency Locked</>
                ) : (
                  <><Calendar size={16} /> {displayFee === 0 ? 'Confirm Booking' : `Pay ₹${displayFee} & Book`}</>
                )}
              </button>

              <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
                 <div className="flex items-center gap-3 text-xs text-indigo-400/60 font-black uppercase tracking-tighter">
                   <Clock size={12} /> Live Jitsi / Google Meet Video
                 </div>
                 <div className="flex items-center gap-3 text-xs text-indigo-400/60 font-black uppercase tracking-tighter">
                   <Award size={12} /> Double Reputation Bonus Included
                 </div>
              </div>
            </motion.div>

            {/* Micro Stats Card */}
            <div className="bg-[#0c0c16]/30 p-8 rounded-[3rem] border border-white/5 text-center">
               <MapPin size={24} className="mx-auto text-gray-700 mb-2" />
               <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Currently transmitting from</p>
               <p className="text-white font-black text-sm uppercase">SkillBridge Node Zero</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
