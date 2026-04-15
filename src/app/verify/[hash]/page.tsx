/**
 * /verify/[hash]/page.tsx
 * 
 * Public page to verify a SkillBridge certificate.
 * High-trust verification fetching directly from the database.
 */

import { createSupabaseServer } from "@/lib/supabase/server";
import CertificateView from "@/components/certificates/CertificateView";
import { notFound } from "next/navigation";
import { ShieldCheck, Calendar, User, BookOpen, Award } from "lucide-react";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{
    hash: string;
  }>;
}

export default async function VerifyPage({ params }: PageProps) {
  const { hash } = await params;
  const supabase = await createSupabaseServer();
  
  // 1. Fetch certificate with user profile data
  const { data: cert, error } = await supabase
    .from("certificates")
    .select(`
      *,
      profiles (
        full_name,
        avatar_url,
        college,
        branch
      )
    `)
    .eq("verification_hash", hash)
    .single();

  if (error || !cert) {
    notFound();
  }

  const profile = cert.profiles as any;

  // 2. Prepare data for the View component
  const transformedData = {
    id: cert.id,
    full_name: profile.full_name || "Unknown Learner",
    subject: cert.subject,
    score: cert.score_achieved,
    cert_type: cert.cert_type,
    issued_at: cert.issued_at,
    verification_hash: cert.verification_hash,
  };

  return (
    <div className="min-h-screen bg-[#080510] py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Verification Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-bold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4" />
              Authenticity Verified
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Official Credential <br />
              <span className="text-indigo-500">Validation</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-lg leading-relaxed">
              This digital certificate has been cryptographically signed and issued by the SkillBridge platform after successful competency assessment.
            </p>
            
            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                 <User className="w-5 h-5 text-indigo-400 mb-2" />
                 <p className="text-[10px] text-gray-500 font-bold uppercase">Issued To</p>
                 <p className="text-white font-medium truncate">{profile.full_name}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                 <Calendar className="w-5 h-5 text-indigo-400 mb-2" />
                 <p className="text-[10px] text-gray-500 font-bold uppercase">Issued On</p>
                 <p className="text-white font-medium">{format(new Date(cert.issued_at), "MMM dd, yyyy")}</p>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#0d091a] border border-white/10 rounded-2xl p-8 shadow-2xl">
               <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-gray-400 text-sm">Subject Area</span>
                    <span className="text-white font-bold">{cert.subject}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-gray-400 text-sm">Score Achieved</span>
                    <span className="text-emerald-400 font-bold">{cert.score_achieved}%</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-gray-400 text-sm">Credential ID</span>
                    <span className="text-gray-300 font-mono text-xs">{cert.id.slice(0, 18)}...</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Auth Method</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-bold uppercase">AI PROCTORED</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* The Certificate Preview Component */}
        <div className="relative transition-all duration-700 animate-in fade-in zoom-in-95 fill-mode-both">
          <CertificateView data={transformedData} />
        </div>

        {/* Footer */}
        <div className="mt-20 py-10 border-t border-white/5 text-center">
            <div className="mb-4 inline-block opacity-40 grayscale hover:grayscale-0 transition-all cursor-default">
               <div className="flex items-center gap-2 text-white font-bold text-xl">
                 <span>SkillBridge</span>
                 <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                 <span className="text-indigo-400">Enterprise</span>
               </div>
            </div>
            <p className="text-gray-500 text-xs tracking-widest uppercase mb-2">Powered by SkillBridge Blockchain-Inspired Verification Engine</p>
            <p className="text-gray-600 text-[10px] font-mono">HASH: {cert.verification_hash}</p>
        </div>
      </div>
    </div>
  );
}
