'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './mentors-apply.css';

export default function MentorApplyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    specialty: '',
    bio: '',
    hourly_rate: 0,
    meeting_link: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/mentors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit application');

      setMessage('Application submitted! Admin will review your profile shortly.');
      setTimeout(() => router.push('/mentors'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sb-page mentor-apply-container">
      <div className="apply-header">
        <h1 className="sb-title">Share Your <span>Expertise</span></h1>
        <p className="sb-subtitle">
          Help your peers grow while earning money. Apply to become a verified mentor on SkillBridge.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="apply-form glass">
        <section className="form-section">
          <h3>Professional Profile</h3>
          <div className="form-group">
            <label>Primary Specialty</label>
            <input 
              type="text" 
              placeholder="e.g., Data Structures, React.js, Engineering Math" 
              value={formData.specialty}
              onChange={e => setFormData({...formData, specialty: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Short Bio</label>
            <textarea 
              placeholder="Tell students why you're a great mentor..." 
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              rows={4}
              required
            />
          </div>
        </section>

        <section className="form-section">
          <h3>Session Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>30-Min Session Fee (₹0 - ₹500)</label>
              <input 
                type="number" 
                min="0" 
                max="500"
                value={formData.hourly_rate}
                onChange={e => setFormData({...formData, hourly_rate: parseInt(e.target.value)})}
                required
              />
            </div>
            <div className="form-group">
              <label>Live Session Link (Google Meet/Jitsi)</label>
              <input 
                type="url" 
                placeholder="https://meet.google.com/..." 
                value={formData.meeting_link}
                onChange={e => setFormData({...formData, meeting_link: e.target.value})}
                required
              />
            </div>
          </div>
        </section>

        {error && <p className="error-msg">{error}</p>}
        {message && <p className="success-msg">{message}</p>}

        <button type="submit" className="sb-btnPrimary" disabled={isLoading} style={{ width: '100%', marginTop: '30px', border: 'none' }}>
          {isLoading ? 'Submitting Application...' : 'Apply to Become a Mentor'}
        </button>
      </form>
    </div>
  );
}
