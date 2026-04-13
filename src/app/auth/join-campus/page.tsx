'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, School, ArrowRight, Loader2 } from 'lucide-react';
import styles from './join.module.css';

export default function JoinCampusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    if (!token) {
      setError('Invalid or expired invitation link.');
      setLoading(false);
      return;
    }

    async function verifyInvite() {
      // Get invitation details including org name
      const { data, error: fetchErr } = await supabase
        .from('campus_invitations')
        .select(`
          *,
          organizations (
            name,
            type
          )
        `)
        .eq('id', token)
        .eq('status', 'pending')
        .single();

      if (fetchErr || !data) {
        setError('This invitation is no longer valid or has already been used.');
      } else {
        setInvitation(data);
      }
      setLoading(false);
    }

    verifyInvite();
  }, [token, supabase]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to auth with return path
        router.push(`/auth?returnTo=/auth/join-campus?token=${token}`);
        return;
      }

      // Call the RPC function to handle the join
      const { error: joinErr } = await supabase.rpc('accept_campus_invitation', {
        invite_id: token,
        target_user_id: user.id
      });

      if (joinErr) throw joinErr;

      router.push('/dashboard?joined=success');
    } catch (err: any) {
      setError(err.message || 'Failed to join campus. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <School size={32} className="text-cyan-400" />
        </div>
        
        <h1 className={styles.title}>Campus Invitation</h1>
        
        {error ? (
          <div className={styles.errorArea}>
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </div>
        ) : (
          <>
            <p className={styles.description}>
              You've been invited to join <strong>{invitation.organizations?.name}</strong> on SkillBridge.
            </p>

            <div className={styles.benefits}>
              <div className={styles.benefitItem}>
                <ShieldCheck size={18} className="text-emerald-400" />
                <span>Access to campus-exclusive study groups</span>
              </div>
              <div className={styles.benefitItem}>
                <ShieldCheck size={18} className="text-emerald-400" />
                <span>Priority AI Solver credits (Campus Plan)</span>
              </div>
              <div className={styles.benefitItem}>
                <ShieldCheck size={18} className="text-emerald-400" />
                <span>Institute-verified certifications</span>
              </div>
            </div>

            <Button 
              className={styles.joinButton}
              onClick={handleJoin}
              loading={joining}
            >
              Accept Invitation <ArrowRight size={18} className="ml-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
