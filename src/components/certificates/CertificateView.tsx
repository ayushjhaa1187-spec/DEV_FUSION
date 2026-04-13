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
  const certRef = useRef<HTMLDivElement>(null);

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

  const verificationUrl = `${window.location.origin}/verify/${data.verification_hash}`;

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
          {/* Decorative Ornaments */}
          <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-indigo-500/30 rounded-tl-3xl m-8" />
          <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-indigo-500/30 rounded-tr-3xl m-8" />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-indigo-500/30 rounded-bl-3xl m-8" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-indigo-500/30 rounded-br-3xl m-8" />

          {/* Header */}
          <div className="text-center z-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                 <Globe className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                SkillBridge
              </span>
            </div>
            <h2 className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-sm mb-2">
              Certificate of Achievement
            </h2>
          </div>

          {/* Recipient */}
          <div className="text-center z-10">
            <p className="text-gray-400 italic mb-6">This is to certify that</p>
            <h1 className="text-4xl md:text-6xl font-serif text-white mb-6">
              {data.full_name}
            </h1>
            <p className="max-w-xl mx-auto text-gray-400 leading-relaxed text-lg">
              has successfully completed the assessment in{" "}
              <span className="text-indigo-300 font-semibold">{data.subject}</span>{" "}
              with a standout performance score of{" "}
              <span className="text-emerald-400 font-bold">{data.score}%</span>.
            </p>
          </div>

          {/* Footer / QR */}
          <div className="w-full flex justify-between items-end z-10 px-10">
            <div className="text-left space-y-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Date Issued</p>
              <p className="text-white font-medium">{format(new Date(data.issued_at), "MMMM dd, yyyy")}</p>
              <div className="h-px w-32 bg-indigo-500/30 my-4" />
              <p className="text-xs text-indigo-400 font-semibold">Verification Official</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="bg-white p-2 rounded-lg shadow-xl">
                <QRCodeSVG value={verificationUrl} size={80} level="H" />
              </div>
              <p className="text-[10px] text-gray-500 font-mono">
                ID: {data.id.split("-")[0]}...
              </p>
            </div>
          </div>

          {/* Background Branding */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <h1 className="text-[15rem] font-bold rotate-[-12deg]">SKILLBRIDGE</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
