'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Search, Building2, Users, Star } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const supabase = createSupabaseBrowser();
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrgs();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setUserProfile(data);
    }
  };

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          members_count: organization_memberships(count)
        `)
        .ilike('name', `%${search}%`);

      if (error) throw error;
      setOrgs(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (orgId: string, minRep: number) => {
    if (!userProfile) return showToast('Please log in first', 'warning');
    
    // Dynamic Reputation Check
    if (userProfile.reputation_points < minRep) {
      return showToast(`This organization requires at least ${minRep} reputation points to join.`, 'warning');
    }

    try {
      const response = await fetch('/api/organizations/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          userId: userProfile.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          showToast('You have already applied to this organization.', 'info');
        } else {
          throw new Error(result.error || 'Failed to send request');
        }
      } else {
        showToast('Request sent! The organization will review your application.', 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">Organizations</h1>
          <p className="text-text-secondary max-w-xl">
            Join elite developer communities and college clubs. High reputation students can affiliate with organizations to unlock exclusive mentorship perks.
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary h-5 w-5" />
          <FormInput
            id="search"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrgs()}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 animate-pulse bg-bg-secondary rounded-xl" />)}
        </div>
      ) : orgs.length === 0 ? (
        <Card className="text-center py-20 bg-bg-secondary border-dashed border-2">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-text-tertiary" />
          <h2 className="text-2xl font-semibold mb-2">No organizations found</h2>
          <p className="text-text-secondary">Be the first to register an organization for your club!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {orgs.map((org) => (
            <Card key={org.id} variant="elevated" className="group hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
              <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
                {org.logo_url ? (
                  <img src={org.logo_url} alt={org.name} className="absolute -bottom-6 left-6 w-20 h-20 rounded-xl border-4 border-white shadow-lg bg-white object-cover" />
                ) : (
                  <div className="absolute -bottom-6 left-6 w-20 h-20 rounded-xl border-4 border-white shadow-lg bg-primary text-white flex items-center justify-center">
                    <Building2 className="h-10 w-10" />
                  </div>
                )}
                {org.is_verified && (
                  <Badge variant="success" className="absolute top-4 right-4">Verified</Badge>
                ) }
              </div>
              
              <CardContent className="pt-10 flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{org.name}</CardTitle>
                </div>
                <CardDescription className="line-clamp-2 mb-4 leading-relaxed">
                  {org.description || 'No description provided.'}
                </CardDescription>
                
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users className="h-4 w-4 text-primary" />
                    {org.members_count?.[0]?.count || 0} Members
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    4.9
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-bg-secondary/50 border-t p-4">
                <Button 
                  onClick={() => handleJoinRequest(org.id, org.min_reputation || 50)}
                  variant={userProfile?.reputation_points >= (org.min_reputation || 50) ? "primary" : "secondary"}
                  className="w-full"
                  disabled={userProfile?.role === 'organization'}
                >
                  {userProfile?.reputation_points >= (org.min_reputation || 50) ? 'Request to Join' : `Locked (Reputation < ${org.min_reputation || 50})`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
