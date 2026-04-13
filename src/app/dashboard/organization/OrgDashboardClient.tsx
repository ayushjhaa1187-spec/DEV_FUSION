'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Users, Shield, Settings, Check, X, Building2, UserPlus, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export default function OrgDashboardClient() {
  const supabase = createSupabaseBrowser();
  const { showToast } = useToast();
  const [org, setOrg] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newMinRep, setNewMinRep] = useState(50);

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Organization
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (orgData) {
      setOrg(orgData);
      setNewMinRep(orgData.min_reputation);
      
      // Fetch Pending Applicants
      const { data: appData } = await supabase
        .from('organization_memberships')
        .select(`
          id,
          status,
          user_id,
          profiles (
            id,
            full_name,
            username,
            avatar_url,
            reputation_points
          )
        `)
        .eq('organization_id', orgData.id)
        .eq('status', 'pending');

      setApplicants(appData || []);
    }
    setLoading(false);
  };

  const handleMembership = async (membershipId: string, status: 'approved' | 'rejected') => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('organization_memberships')
        .update({ status })
        .eq('id', membershipId);

      if (error) throw error;
      
      showToast(`Applicant ${status} successfully`, 'success');
      setApplicants(prev => prev.filter(a => a.id !== membershipId));
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const updateReputationGate = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ min_reputation: newMinRep })
        .eq('id', org.id);

      if (error) throw error;
      showToast('Reputation filter updated', 'success');
      setOrg({ ...org, min_reputation: newMinRep });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-text-secondary">Loading Organization...</div>;
  if (!org) return <div className="p-12 text-center text-text-secondary">No organization found for this account.</div>;

  return (
    <div className="container mx-auto px-4 py-32">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar / Stats */}
        <div className="lg:w-1/3 space-y-8">
          <Card className="bg-bg-secondary/50 border-border-color">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Building2 size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">{org.name}</h2>
                  <p className="text-xs text-text-tertiary">Verified Organization</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-bg-primary rounded-xl border border-border-color">
                  <p className="text-[10px] uppercase text-text-tertiary mb-1">Members</p>
                  <p className="text-2xl font-bold text-white">12</p>
                </div>
                <div className="p-4 bg-bg-primary rounded-xl border border-border-color">
                  <p className="text-[10px] uppercase text-text-tertiary mb-1">Rating</p>
                  <p className="text-2xl font-bold text-amber-500">4.9</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-secondary/50 border-border-color">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="text-primary" size={20} /> Reputation Gating
              </CardTitle>
              <CardDescription>Custom barrier for new applicants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Threshold</span>
                  <span className="text-primary font-bold">{newMinRep} pts</span>
                </div>
                <input 
                  type="range" min="0" max="1000" step="50"
                  value={newMinRep}
                  onChange={e => setNewMinRep(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                className="w-full" 
                loading={updating}
                onClick={updateReputationGate}
              >
                Apply Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Applicants */}
        <div className="lg:w-2/3">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <UserPlus className="text-primary" /> Pending Membership Requests 
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{applicants.length}</span>
          </h3>

          <div className="space-y-4">
            {applicants.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-bg-secondary/30 border-2 border-dashed border-border-color">
                <Users className="mx-auto text-text-tertiary mb-4" size={48} />
                <p className="text-text-secondary">No pending applications at the moment.</p>
              </div>
            ) : (
              applicants.map((app) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={app.id} 
                  className="p-6 bg-bg-secondary/50 border border-border-color rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-primary border border-border-color">
                      {app.profiles.avatar_url ? (
                        <img src={app.profiles.avatar_url} alt={app.profiles.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-tertiary uppercase">
                          {app.profiles.username?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{app.profiles.full_name || app.profiles.username}</h4>
                      <p className="text-xs text-text-secondary flex items-center gap-1.5">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        {app.profiles.reputation_points} Reputation Points
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20"
                        onClick={() => handleMembership(app.id, 'rejected')}
                        disabled={updating}
                    >
                      <X size={16} />
                    </Button>
                    <Button 
                        variant="primary" 
                        size="sm"
                        className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border-green-500/20 px-6"
                        onClick={() => handleMembership(app.id, 'approved')}
                        disabled={updating}
                    >
                      <Check size={16} className="mr-2" /> Approve
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
