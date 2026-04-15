/**
 * /app/dashboard/certificates/page.tsx
 * 
 * Lists a user's earned certificates.
 */

import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CertificateView from "@/components/certificates/CertificateView";
import { Award, ShieldCheck, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function CertificatesDashboardPage() {
  const supabase = await createSupabaseServer();

  // 1. Auth & Profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // 2. Fetch User's Certificates
  const { data: certificates, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("[dashboard/certs] Error:", error);
  }

  return (
    <div className="min-h-screen bg-[#0a0612] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-500" />
              Achievements & Certifications
            </h1>
            <p className="text-gray-400 mt-2">
              View, download, and share your verified academic accomplishments.
            </p>
          </div>
          <Link
            href="/practice"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all font-semibold flex items-center gap-2"
          >
            Take a New Test
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {certificates && certificates.length > 0 ? (
          <div className="grid grid-cols-1 gap-12">
            {certificates.map((cert) => (
              <div key={cert.id} className="bg-[#13111e] rounded-3xl p-8 border border-white/5 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                
                <div className="flex items-center gap-2 mb-8">
                   <ShieldCheck className="w-5 h-5 text-indigo-400" />
                   <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Verified Digital ID: {cert.verification_hash.slice(0, 8)}</span>
                </div>

                <CertificateView
                  data={{
                    id: cert.id,
                    full_name: profile?.full_name || "SkillBridge Student",
                    subject: cert.subject,
                    score: cert.score_achieved,
                    cert_type: cert.cert_type,
                    issued_at: cert.issued_at,
                    verification_hash: cert.verification_hash,
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#13111e] rounded-3xl border border-dashed border-white/10">
            <div className="w-20 h-20 bg-amber-500/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-gray-700" />
            </div>
            <h3 className="text-xl font-semibold text-white">No certificates yet</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
              Complete subject assessments or domain tests to earn your verified certifications.
            </p>
            <Link
              href="/practice"
              className="inline-flex mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold"
            >
              Master Your First Subject
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
