'use client';

import { useState, useEffect } from 'react';
import { authApi, subjectApi } from '@/lib/api';
import { Check, Plus, X } from 'lucide-react';

interface ProfileEditFormProps {
  initialProfile: any;
  onSuccess: () => void;
}

export default function ProfileEditForm({ initialProfile, onSuccess }: ProfileEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: initialProfile?.full_name || '',
    college: initialProfile?.college || '',
    branch: initialProfile?.branch || '',
    semester: initialProfile?.semester || 1,
    bio: initialProfile?.bio || '',
    github_url: initialProfile?.github_url || '',
    linkedin_url: initialProfile?.linkedin_url || '',
    website_url: initialProfile?.website_url || ''
  });

  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(true);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const [all, mine] = await Promise.all([
          subjectApi.getSubjects(),
          authApi.getMySubjects()
        ]);
        setAllSubjects(all || []);
        setSelectedSubjects(mine?.map((s: any) => s.subject_id) || []);
      } catch (err) {
        console.error('Failed to load subjects', err);
      } finally {
        setIsSubjectsLoading(false);
      }
    }
    loadSubjects();
  }, []);

  const toggleSubject = (id: string) => {
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(selectedSubjects.filter(sid => sid !== id));
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await Promise.all([
        authApi.updateProfile(formData),
        authApi.updateSubjects(selectedSubjects)
      ]);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="sb-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Edit Academic Profile</h2>
      
      {error && <div style={{ color: '#ef4444', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', fontSize: '0.9rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Full Name</label>
          <input 
            type="text" 
            className="sb-input"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            placeholder="e.g. Ayush Jha"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>College / University</label>
          <input 
            type="text" 
            className="sb-input"
            value={formData.college}
            onChange={(e) => setFormData({...formData, college: e.target.value})}
            placeholder="e.g. IIT Delhi"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Branch / Major</label>
          <input 
            type="text" 
            className="sb-input"
            value={formData.branch}
            onChange={(e) => setFormData({...formData, branch: e.target.value})}
            placeholder="e.g. Computer Science"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Semester (1-8)</label>
          <input 
            type="number" 
            min="1" max="8"
            className="sb-input"
            value={formData.semester}
            onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Bio</label>
        <textarea 
          className="sb-input"
          style={{ minHeight: '100px', resize: 'vertical' }}
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          placeholder="Tell other students about your skills and interests..."
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Enroll in Subjects</label>
        {isSubjectsLoading ? (
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading curriculum data...</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allSubjects.map(s => {
              const isActive = selectedSubjects.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSubject(s.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '99px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isActive ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
                    color: isActive ? 'white' : '#94a3b8'
                  }}
                >
                  {isActive ? <Check size={14} /> : <Plus size={14} />}
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
          Select subjects to personalize your doubt feed and practice tests.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>GitHub URL</label>
          <input 
            type="url" 
            className="sb-input"
            value={formData.github_url}
            onChange={(e) => setFormData({...formData, github_url: e.target.value})}
            placeholder="https://github.com/..."
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>LinkedIn URL</label>
          <input 
            type="url" 
            className="sb-input"
            value={formData.linkedin_url}
            onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
      </div>

      <button 
        type="submit" 
        className="sb-button-primary"
        disabled={loading}
        style={{ marginTop: '0.5rem', height: '48px', fontWeight: 700 }}
      >
        {loading ? 'Saving Changes...' : 'Save Profile'}
      </button>

      <style jsx>{`
        .sb-input {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #e2e8f0;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .sb-input:focus {
          outline: none;
          border-color: #8b5cf6;
        }
        .sb-button-primary {
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
        }
        .sb-button-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.55);
        }
        .sb-button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}
