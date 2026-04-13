import React from 'react';
import { createSupabaseServer } from '@/lib/supabase/server';
import { Award, ShieldCheck, XCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function VerifyCertificatePage({ params }: { params: { certId: string } }) {
  const supabase = await createSupabaseServer();
  
  // Public read of the certificate hash
  const { data: cert, error } = await supabase
    .from('certificates')
    .select(`
      *,
      profiles(full_name, username)
    `)
    .eq('verification_hash', params.certId)
    .single();

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center text-white p-6">
        <div className="text-center space-y-6 bg-red-900/20 p-12 rounded-3xl border border-red-500/20 max-w-lg">
          <XCircle className="w-20 h-20 text-red-500 mx-auto" />
          <h1 className="text-3xl font-black text-white">Invalid Certificate</h1>
          <p className="text-red-200">
            We could not verify this certificate. It may be invalid or the URL might be incorrect.
          </p>
        </div>
      </div>
    );
  }

  // Formatting text mapping
  const typeMap: Record<string, string> = {
    'test_passed': 'Certificate of Completion',
    'mentor_excellence': 'Mentorship Excellence'
  };

  const title = typeMap[cert.certificate_type] || 'Verified Certificate';
  const name = cert.profiles?.full_name || cert.profiles?.username || 'Student';

  return (
    <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center text-white p-6">
      <div className="w-full max-w-3xl border-8 border-indigo-500/30 p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-[#1a1a3a] to-[#0a0a1a] shadow-2xl relative overflow-hidden">
        
        {/* Certificate Watermark / BG graphics */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-500 opacity-5 rounded-full blur-3xl mix-blend-screen pointer-events-none" />

        <div className="relative text-center space-y-8 z-10">
          
          <div className="flex justify-center mb-6">
            <Award className="w-24 h-24 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
          </div>
          
          <div>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-widest text-indigo-100 font-serif leading-tight">
              {title}
            </h1>
            <p className="text-indigo-400 font-bold tracking-[0.2em] uppercase mt-4">
              SkillBridge Verified Academy
            </p>
          </div>

          <div className="space-y-4 py-8">
            <p className="text-gray-400 italic text-xl">This certifies that</p>
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 pt-2 pb-4">
              {name}
            </h2>
            <p className="text-gray-400 italic text-xl max-w-xl mx-auto">
              has successfully achieved excellence in academic assessments / mentorship contribution.
            </p>
            {cert.score && (
              <p className="text-2xl font-bold text-emerald-400 mt-4">
                Score: {cert.score}%
              </p>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end border-t border-white/10 pt-12 mt-12 gap-8">
            <div className="text-left w-full md:w-auto">
              <p className="text-gray-500 text-sm uppercase tracking-widest mb-1">Issue Date</p>
              <p className="font-mono text-lg">{new Date(cert.issued_at).toLocaleDateString()}</p>
            </div>

            <div className="bg-[#090912] border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4 mx-auto md:mx-0 shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
              <div className="text-left">
                <p className="text-emerald-500 text-sm uppercase tracking-widest font-bold mb-1">Verified Authentic</p>
                <p className="font-mono text-xs text-gray-500 break-all w-32 md:w-48 leading-tight">
                  ID: {cert.verification_hash}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
