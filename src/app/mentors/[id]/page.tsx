import ReputationBadge from '@/components/user/ReputationBadge';
import styles from './profile.module.css';

const MOCK_MENTOR = {
  id: '1',
  name: 'Dr. Jane Smith',
  specialty: 'Machine Learning & Data Science',
  bio: 'Experienced researcher and practitioner in AI/ML with over 10 years of experience in the industry. Specialized in Neural Networks and Natural Language Processing.',
  rating: 4.9,
  sessions: 124,
  price: 300,
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250&h=250',
  points: 1250,
  skills: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Math'],
  availability: [
    { id: 's1', time: 'Mon, 10:00 AM', isBooked: false },
    { id: 's2', time: 'Mon, 11:30 AM', isBooked: true },
    { id: 's3', time: 'Wed, 02:00 PM', isBooked: false },
    { id: 's4', time: 'Fri, 04:00 PM', isBooked: false },
  ],
};

export default function MentorProfilePage() {
  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.headerMain}>
          <div className={styles.avatarGlow}>
            <img src={MOCK_MENTOR.avatar} alt={MOCK_MENTOR.name} className={styles.avatar} />
          </div>
          <div className={styles.info}>
            <h1 className={styles.name}>{MOCK_MENTOR.name}</h1>
            <p className={styles.specialty}>{MOCK_MENTOR.specialty}</p>
            <ReputationBadge points={MOCK_MENTOR.points} showBadges />
          </div>
        </div>
        <div className={styles.quickStats}>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{MOCK_MENTOR.rating} ★</span>
            <span className={styles.statLab}>Rating</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{MOCK_MENTOR.sessions}+</span>
            <span className={styles.statLab}>Sessions</span>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.leftCol}>
          <section className={`${styles.section} glass`}>
            <h3>About</h3>
            <p>{MOCK_MENTOR.bio}</p>
          </section>
          
          <section className={`${styles.section} glass`}>
            <h3>Skills & Expertise</h3>
            <div className={styles.skills}>
              {MOCK_MENTOR.skills.map(skill => <span key={skill} className={styles.skillTag}>{skill}</span>)}
            </div>
          </section>
        </div>

        <div className={styles.rightCol}>
          <section className={`${styles.bookingCard} glass`}>
            <h3>Book a Session</h3>
            <p className={styles.priceLine}>
              <span className={styles.price}>₹{MOCK_MENTOR.price}</span> / 30 mins
            </p>
            
            <div className={styles.slots}>
              {MOCK_MENTOR.availability.map(slot => (
                <button 
                  key={slot.id} 
                  className={`${styles.slotBtn} ${slot.isBooked ? styles.booked : ''}`}
                  disabled={slot.isBooked}
                >
                  {slot.time}
                  {slot.isBooked && <span className={styles.bookedLabel}>Booked</span>}
                </button>
              ))}
            </div>
            
            <button className={styles.mainBookBtn}>Confirm Booking</button>
            <p className={styles.note}>Sandbox payment will be triggered</p>
          </section>
        </div>
      </div>
    </div>
  );
}
