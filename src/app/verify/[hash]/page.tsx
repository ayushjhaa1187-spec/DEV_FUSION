/**
 * /verify/[hash]/page.tsx
 * 
 * Public page to verify a SkillBridge certificate.
 * No auth required.
 */

import { Suspense } from "react";
import { createSupabaseServer } from "@/lib/supabase/server";
import CertificateView from "@/components/certificates/CertificateView";
import { notFound } from "next/navigation";
import { Globe, ShieldCheck, AlertCircle } from "lucide-react";

interface PageProps {
  params: {
    hash: string;
  };
}

async function getCertificate(hash: string) {
  const supabase = await createSupabaseServer();
  
  const { data, error } = await supabase
    .from("certificates")
    .select("*, users!inner(full_name, avatar_url)")
    .eq("verification_hash", hash)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function VerifyPage({ params }: PageProps) {
  const cert = await getCertificate(params.hash);

  if (!cert) {
    notFound();
  }

  // Transform data for CertificateView
  const transformedData = {
    id: cert.id,
    full_name: cert.users.full_name,
    subject: cert.subject,
    score: cert.score_achieved,
    cert_type: cert.cert_type,
    issued_at: cert.issued_at,
    verification_hash: cert.verification_hash,
  };

  return (
    <div className="min-h-screen bg-[#0a0612] py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Verification Status Banner */}
        <div className="flex items-center justify-center gap-3 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Authenticity Verified</h1>
            <p className="text-gray-400 text-sm">This is a genuine SkillBridge certification record.</p>
          </div>
        </div>

        <div className="animate-in fade-in zoom-in-95 duration-1000 delay-300">
          <CertificateView data={transformedData} />
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm border-t border-white/5 pt-8">
          <p>SkillBridge Public Verification Registry</p>
          <p className="mt-1">Verification ID: {cert.verification_hash.slice(0, 16)}...</p>
        </div>
      </div>
    </div>
  );
}
