'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Users, 
  Globe,
  ExternalLink,
  ChevronLeft,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  slug: string;
  website: string;
  is_verified: boolean;
  member_count: number;
  created_at: string;
  owner: {
    full_name: string;
    email: string;
  };
}

export default function AdminInstitutionsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'admin')) {
      router.push('/dashboard');
    } else if (user) {
      fetchOrgs();
    }
  }, [user, profile, authLoading, router]);

  const fetchOrgs = async () => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        owner:owner_id (full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load institutions');
    } else {
      // Get member counts for each org
      const orgsWithCounts = await Promise.all(data.map(async (org: any) => {
          const { count } = await supabase
            .from('organization_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);
          return { ...org, member_count: count || 0 };
      }));
      setOrgs(orgsWithCounts);
    }
    setLoading(false);
  };

  const toggleVerification = async (orgId: string, currentStatus: boolean) => {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from('organizations')
      .update({ is_verified: !currentStatus })
      .eq('id', orgId);

    if (error) {
      toast.error('Update failed');
    } else {
      toast.success(`Institution ${!currentStatus ? 'verified' : 'unverified'}`);
      fetchOrgs();
    }
  };

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Link href="/admin" className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest mb-4 hover:translate-x-1 transition-transform">
              <ChevronLeft size={14} /> Back to Command
            </Link>
            <h1 className="text-4xl font-black tracking-tight mb-2">Institutional Hub</h1>
            <p className="text-gray-400">Manage Campus Partners and Verified Organizations</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Filter by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-indigo-500/50 transition-colors w-full md:w-80 font-medium"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {filteredOrgs.map((org) => (
            <div key={org.id} className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group hover:bg-white/[0.07] transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Building2 size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-black">{org.name}</h3>
                    {org.is_verified && (
                      <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-lg" title="Verified Institution">
                        <ShieldCheck size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                    <span className="flex items-center gap-2"><Globe size={14} /> {org.website || 'No website'}</span>
                    <span className="flex items-center gap-2"><Users size={14} /> {org.member_count} Members</span>
                    <span className="flex items-center gap-2 text-gray-600">ID: {org.slug}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-right sm:mr-6">
                  <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-0.5">Owner</div>
                  <div className="text-sm font-bold text-indigo-300">{org.owner?.full_name || 'System'}</div>
                </div>
                
                <button 
                  onClick={() => toggleVerification(org.id, org.is_verified)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    org.is_verified 
                      ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                  }`}
                >
                  {org.is_verified ? (
                    <><XCircle size={16} /> Revoke Status</>
                  ) : (
                    <><CheckCircle2 size={16} /> Verify Institution</>
                  )}
                </button>

                <Link 
                  href={`/organizations/${org.slug}`}
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                  target="_blank"
                >
                  <ExternalLink size={18} />
                </Link>
              </div>
            </div>
          ))}

          {filteredOrgs.length === 0 && (
            <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
              <Building2 className="mx-auto w-16 h-16 text-gray-700 mb-6" />
              <p className="text-gray-500 font-bold">No registered institutions found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
