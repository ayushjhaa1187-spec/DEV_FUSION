/**
 * components/recruitment/TalentSpotlight.tsx
 *
 * A specialized leaderboard for recruiters to find top talent.
 * Filters by subject mastery, high reputation, and certified users.
 */

"use client";

import React, { useState } from "react";
import { Search, Filter, Award, CheckCircle2, Star, Zap, Briefcase } from "lucide-react";

interface Candidate {
  id: string;
  full_name: string;
  avatar_url?: string;
  reputation_points: number;
  badges: string[];
  certified_subjects: string[];
  top_score: number;
  solved_doubts: number;
  rank: number;
}

export default function TalentSpotlight({ candidates }: { candidates: Candidate[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = candidates.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === "certified") return matchesSearch && c.certified_subjects.length > 0;
    if (filter === "top_tier") return matchesSearch && c.reputation_points > 1000;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-white bg-[#0a0612] min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
            <Zap className="w-3 h-3" />
            Recruiter Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
            Talent Spotlight
          </h1>
          <p className="text-gray-400 max-w-lg">
            Discover the top 1% of problem solvers and certified experts across SkillBridge.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name..."
              className="bg-[#13111e] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="bg-[#13111e] border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Candidates</option>
            <option value="certified">Certified Only</option>
            <option value="top_tier">Reputation &gt; 1000</option>
          </select>
        </div>
      </div>

      {/* Talent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
        {filtered.map((candidate, idx) => (
          <CandidateCard key={candidate.id} candidate={candidate} index={idx} />
        ))}
      </div>

      {filtered.length === 0 && (
         <div className="text-center py-20 bg-[#13111e] rounded-3xl border border-dashed border-white/10">
           <Zap className="w-12 h-12 text-gray-700 mx-auto mb-4" />
           <p className="text-gray-500">No candidates match your criteria.</p>
         </div>
      )}
    </div>
  );
}

function CandidateCard({ candidate, index }: { candidate: Candidate; index: number }) {
  return (
    <div className="group relative bg-[#13111e] hover:bg-[#1a1727] border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
      {/* Rank Badge */}
      <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xs font-bold shadow-lg border border-white/10">
        #{candidate.rank}
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 border border-white/10 overflow-hidden flex-shrink-0">
          {candidate.avatar_url ? (
            <img src={candidate.avatar_url} alt={candidate.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
              {candidate.full_name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">
            {candidate.full_name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-0.5">
            <CheckCircle2 className="w-3 h-3" />
            Available for Internships
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <div className="text-indigo-400 font-bold text-sm">{candidate.reputation_points}</div>
          <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Rep</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <div className="text-emerald-400 font-bold text-sm">{candidate.top_score}%</div>
          <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Avg Score</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <div className="text-amber-400 font-bold text-sm">{candidate.solved_doubts}</div>
          <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Solved</div>
        </div>
      </div>

      {/* Subjects */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {candidate.certified_subjects.map(sub => (
            <span key={sub} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 font-bold uppercase">
              <Award className="w-2.5 h-2.5" />
              {sub}
            </span>
          ))}
          {candidate.certified_subjects.length === 0 && (
             <span className="text-[10px] text-gray-600 font-medium">No verified certifications</span>
          )}
        </div>
      </div>

      {/* Action */}
      <button className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors">
        <Briefcase className="w-4 h-4" />
        View Portfolio
      </button>
    </div>
  );
}
