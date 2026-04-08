'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function checkAdminAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'admin') {
        setIsAdmin(true);
        const { data } = await supabase
          .from('mentor_applications')
          .select('*, profiles(username, full_name, avatar_url, reputation_points)')
          .eq('status', 'pending');
        setApps(data || []);
      }
      setLoading(false);
    }
    checkAdminAndLoad();
  }, []);

  const handleAction = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/mentors/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setApps(apps.filter(a => a.user_id !== userId));
      }
    } catch (err) {
      console.error('Action failed');
    }
  };

  if (loading) return <div className="sb-page">Verifying administrator access...</div>;
  if (!isAdmin) return <div className="sb-page">Permission denied. You must be an administrator to view this page.</div>;

  return (
    <main className="sb-page">
      <Navbar />
      <div className="admin-container" style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px' }}>
        <h1 className="sb-title" style={{ marginBottom: '40px' }}>Mentor <span>Vetting</span></h1>
        
        {apps.length === 0 ? (
          <div className="glass" style={{ padding: '60px', textAlign: 'center', borderRadius: '24px' }}>
            <span style={{ fontSize: '3rem' }}>✅</span>
            <h2 style={{ marginTop: '20px' }}>No pending applications</h2>
            <p style={{ color: 'var(--muted)' }}>You've cleared the queue! All mentors are vetted.</p>
          </div>
        ) : (
          <div className="apps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '30px' }}>
            {apps.map((app: any) => (
              <div key={app.id} className="glass" style={{ padding: '30px', borderRadius: '24px' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <img src={app.profiles.avatar_url || `https://ui-avatars.com/api/?name=${app.profiles.username}`} alt="" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
                  <div>
                    <h3 style={{ margin: 0 }}>{app.profiles.full_name || app.profiles.username}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>@{app.profiles.username} • {app.profiles.reputation_points} Reputation</p>
                  </div>
                </div>
                
                <div className="app-details" style={{ marginBottom: '25px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Expertise Areas</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {app.expertise_areas?.map((ex: string) => (
                      <span key={ex} className="sb-badge" style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(255,255,255,0.05)' }}>{ex}</span>
                    ))}
                  </div>
                </div>

                <div className="app-actions" style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={() => handleAction(app.user_id, 'approved')} className="sb-btnPrimary" style={{ flex: 1, border: 'none', background: '#06d6a0' }}>Approve</button>
                  <button onClick={() => handleAction(app.user_id, 'rejected')} className="sb-btnGhost" style={{ flex: 1 }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
