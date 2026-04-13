/**
 * /app/recruitment/page.tsx
 * 
 * Public/Recruiter portal for finding top talent.
 */

import { createSupabaseServer } from "@/lib/supabase/server";
import TalentSpotlight from "@/components/recruitment/TalentSpotlight";
import { Zap } from "lucide-react";

export default async function RecruitmentPage() {
  const supabase = await createSupabaseServer();

  // 1. Fetch Top Candidates
  // Criteria: Top reputation + join with certificates
  const { data: rawCandidates, error } = await supabase
    .from("users")
    .select(`
      id,
      full_name,
      avatar_url,
      reputation_points,
      certificates (
        subject,
        score_achieved
      )
    `)
    .order("reputation_points", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[recruitment] Error fetching talent:", error);
  }

  // 2. Transform into component-friendly data
  const candidates = (rawCandidates || []).map((user, idx) => {
    const certs = user.certificates as any[] || [];
    const topScore = certs.length > 0 ? Math.max(...certs.map(c => c.score_achieved)) : 0;
    
    return {
      id: user.id,
      full_name: user.full_name || "Unknown Candidate",
      avatar_url: user.avatar_url,
      reputation_points: user.reputation_points || 0,
      badges: [], // Could fetch from reputation_log if needed
      certified_subjects: certs.map(c => c.subject),
      top_score: topScore,
      solved_doubts: Math.floor((user.reputation_points || 0) / 10), // Proxy metric
      rank: idx + 1
    };
  });

  return (
    <div className="min-h-screen bg-[#0a0612]">
      {/* Decorative Blur Background */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -ml-64 -mb-64 pointer-events-none" />
      
      <div className="relative z-10">
        <TalentSpotlight candidates={candidates} />
      </div>

      <footer className="py-12 text-center border-t border-white/5 relative z-10">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-4">
          <Zap className="w-4 h-4 text-indigo-500" />
          <span>SkillBridge Talent Network</span>
        </div>
        <p className="text-gray-600 text-xs">
          Exclusive access for verified institutional and corporate recruiters.
        </p>
      </footer>
    </div>
  );
}
