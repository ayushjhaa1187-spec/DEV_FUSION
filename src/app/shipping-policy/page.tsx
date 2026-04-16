import { Metadata } from 'next';
import { Truck, ArrowLeft, Globe, Zap, Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shipping Policy | SkillBridge Academy',
  description: 'Our policy regarding the delivery and fulfillment of digital courses and materials.',
};

export default function ShippingPolicyPage() {
  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', padding: '120px 24px' }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 font-bold mb-12 hover:text-indigo-300 transition-all">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 text-emerald-500 mb-6 font-bold">
            <Truck size={24} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Fulfillment Policy</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Digital Delivery.
          </h1>
          <p className="text-gray-400 font-medium">Last Updated: April 16, 2026</p>
        </header>

        <section className="prose prose-invert max-w-none space-y-12">
          <div className="bg-white/5 border border-white/10 p-10 rounded-[40px]">
             <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <Zap className="text-emerald-500" /> Instant Access
            </h2>
            <p className="text-gray-400 font-bold leading-relaxed mb-6">
              All our products are digital and delivered immediately upon successful payment confirmation. No physical shipping is required or provided for our learning materials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px]">
                <h3 className="text-xl font-black mb-4">Delivery Method</h3>
                <p className="text-gray-500 font-bold leading-relaxed">
                  Upon completion of your purchase, you will receive an automated email with access instructions to your dashboard.
                </p>
             </div>
             <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px]">
                <h3 className="text-xl font-black mb-4">Global Reach</h3>
                <p className="text-gray-500 font-bold leading-relaxed flex items-center gap-2">
                  <Globe size={16} /> Our learning materials are accessible worldwide via the SkillBridge cloud platform.
                </p>
             </div>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 p-10 rounded-[40px]">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
              <Mail className="text-indigo-500" /> Issues with Access?
            </h3>
            <p className="text-indigo-300 font-bold mb-6">
              If you do not receive your access link within 5 minutes of purchase, please check your spam folder or contact our support team.
            </p>
            <Link href="/contact" className="text-indigo-400 font-black hover:text-white transition-colors underline underline-offset-8">
               Contact Support Team
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
