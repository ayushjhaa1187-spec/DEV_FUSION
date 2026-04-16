import { Metadata } from 'next';
import { ShieldAlert, ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy | SkillBridge Academy',
  description: 'Our policy regarding refunds and cancellations for our digital products and services.',
};

export default function RefundPolicyPage() {
  return (
    <main className="sb-page dark" style={{ minHeight: '100vh', padding: '120px 24px' }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 font-bold mb-12 hover:text-indigo-300 transition-all">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 text-rose-500 mb-6 font-bold">
            <RefreshCcw size={24} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Customer Protection</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Refund Policy.
          </h1>
          <p className="text-gray-400 font-medium">Last Updated: April 16, 2026</p>
        </header>

        <section className="prose prose-invert max-w-none space-y-12">
          <div className="bg-white/5 border border-white/10 p-10 rounded-[40px]">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <ShieldAlert className="text-rose-500" /> Digital Services
            </h2>
            <p className="text-gray-400 font-bold leading-relaxed mb-6">
              As SkillBridge Academy provides non-tangible, irrevocable digital goods, we do not issue refunds for any digital course or membership once the order is confirmed and the product is sent/accessed. 
            </p>
            <p className="text-gray-400 font-bold leading-relaxed">
              We recommend contacting us for assistance if you experience any issues receiving or downloading our products.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black">Exceptions</h3>
            <p className="text-gray-400 font-bold leading-relaxed">
              Refunds may be considered under the following unique circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-4 text-gray-500 font-medium">
              <li>Non-delivery of the product: due to some mailing issues of your e-mail provider or our own server you might not receive a delivery e-mail from us.</li>
              <li>Download issues: it may happen that you are having problems while downloading the product or its unzipping.</li>
              <li>Major defects: although all the products are thoroughly tested before release, unexpected errors may occur.</li>
            </ul>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 p-10 rounded-[40px] text-center">
            <h3 className="text-xl font-black mb-4">Contact Support</h3>
            <p className="text-indigo-300 font-bold mb-8">
              If you have any questions about our Refund Policy, please reach out to us.
            </p>
            <a href="mailto:support@skillbridge.academy" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-500 transition-all">
              support@skillbridge.academy
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
