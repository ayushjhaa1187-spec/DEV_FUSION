/**
 * components/certificates/CertificateView.tsx
 *
 * A premium, glassmorphic certificate viewer with QR verification
 * and PDF download support.
 */

"use client";

import React, { useRef, useState } from "react";
import { Download, Share2, ShieldCheck, Globe } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";

interface CertificateProps {
  data: {
    id: string;
    full_name: string;
    subject: string;
    score: number;
    cert_type: string;
    issued_at: string;
    verification_hash: string;
  };
}

export default function CertificateView({ data }: CertificateProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // SSR Safe: only runs on mount in the browser
    if (typeof window !== 'undefined') {
      setVerificationUrl(`${window.location.origin}/verify/${data.verification_hash}`);
    }
  }, [data.verification_hash]);

  const downloadPDF = async () => {
    if (!certRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0a0612",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SkillBridge_Cert_${data.subject.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 text-sm font-medium">
          <ShieldCheck className="w-4 h-4" />
          Verified Secure
        </div>
        <div className="flex items-center gap-2">
           <button
            onClick={() => navigator.clipboard.writeText(verificationUrl)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm border border-white/10"
          >
            <Share2 className="w-4 h-4" />
            Copy Link
          </button>
          <button
            onClick={downloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? "Processing..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* The Certificate Canvas */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0612] p-1 shadow-2xl">
        <div
          ref={certRef}
          className="relative aspect-[1.414/1] w-full bg-[#0a0612] p-12 md:p-20 flex flex-col items-center justify-between border-8 border-double border-indigo-500/20"
        >
          {/* Decorative Corner Ornaments - Minimalist */}
          <div className="absolute top-0 left-0 w-2 h-24 bg-indigo-600 m-8" />
          <div className="absolute top-0 left-0 w-24 h-2 bg-indigo-600 m-8" />
          <div className="absolute top-0 right-0 w-2 h-24 bg-indigo-600 m-8" />
          <div className="absolute top-0 right-0 w-24 h-2 bg-indigo-600 m-8" />

          {/* Header */}
          <div className="text-center z-10 pt-4">
            <div className="flex flex-col items-center gap-2 mb-8">
              <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mb-2">
                 <Globe className="text-indigo-600 w-8 h-8" />
              </div>
              <span className="text-xl font-bold text-gray-800 tracking-tight">
                SkillBridge Academy
              </span>
            </div>
            <h2 className="text-gray-900 font-black uppercase tracking-[0.3em] text-3xl mb-4">
              Certificate of Completion
            </h2>
          </div>

          {/* Recipient */}
          <div className="text-center z-10 -mt-8">
            <p className="text-gray-600 italic mb-8 text-xl">This certifies that</p>
            <h1 className="text-5xl md:text-7xl font-serif text-gray-900 mb-10 border-b-2 border-gray-100 pb-4 px-20">
              {data.full_name}
            </h1>
            <p className="max-w-2xl mx-auto text-gray-600 leading-relaxed text-lg italic">
              has demonstrated proficiency in <span className="text-indigo-600 font-bold uppercase tracking-wider">{data.subject}</span>, fulfilling all course requirements with distinction.
            </p>
          </div>

          {/* Verification Center */}
          <div className="flex items-center justify-center gap-8 z-10 mb-12">
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
              <QRCodeSVG value={verificationUrl} size={70} level="M" />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20">
                 <ShieldCheck className="text-emerald-600 w-8 h-8" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase mt-1">Certified</span>
            </div>
          </div>

          {/* Footer / Signatures */}
          <div className="w-full flex justify-between items-end z-10 px-20 pb-4">
             {/* Left - Director */}
            <div className="text-center space-y-2">
              <p className="text-lg font-serif italic text-gray-900 border-b border-gray-300 px-4 min-w-[180px]">Jahnvi Chauhan</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Director of Program</p>
            </div>

            {/* Right - Course Provider */}
            <div className="text-center space-y-2">
              <p className="text-lg font-serif italic text-gray-900 border-b border-gray-300 px-4 min-w-[180px]">Expert Mentors</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Course Provider</p>
            </div>
          </div>

          {/* Background Branding Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
            <h1 className="text-[12rem] font-bold">VERIFIED</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
