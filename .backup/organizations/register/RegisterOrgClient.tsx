'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Globe, FileText, Link, Shield, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import { useToast } from '@/components/ui/Toast';

export default function RegisterOrgClient() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    website: '',
    logo_url: '',
    min_reputation: 50
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to register');

      showToast('Organization Registered Successfully!', 'success');
      router.push('/dashboard/organization');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-bg-primary pt-32 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6"
          >
            <Building2 size={32} />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-4">Establish Your Organization</h1>
          <p className="text-text-secondary">Register your college club or development agency to aggregate talent and host exclusive mentorship sessions.</p>
        </div>

        <Card className="bg-bg-secondary/50 backdrop-blur-xl border-border-color shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormInput
                        id="name"
                        label="Organization Name"
                        placeholder="e.g. Google Developer Student Clubs"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                      <FormInput
                        id="slug"
                        label="Custom URL (Slug)"
                        placeholder="e.g. gdsc-mit"
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                        required
                        helperText={`Your page will be: skillbridge.dev/orgs/${formData.slug || 'slug'}`}
                      />
                    </div>

                    <FormInput
                      id="logo"
                      label="Logo URL"
                      placeholder="https://example.com/logo.png"
                      value={formData.logo_url}
                      onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                    />

                    <div className="flex justify-end">
                      <Button type="button" variant="primary" onClick={nextStep} disabled={!formData.name || !formData.slug}>
                        Configure Requirements <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-8"
                  >
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                        <Shield size={20} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-1">Applicant Gating</h4>
                        <p className="text-xs text-text-secondary">Users must exceed this reputation threshold to apply. You can change this at any time in your dashboard.</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-3">Minimum Reputation To Apply</label>
                      <div className="flex items-center gap-6">
                        <input 
                          type="range" 
                          min="0" 
                          max="1000" 
                          step="50"
                          value={formData.min_reputation}
                          onChange={e => setFormData({ ...formData, min_reputation: parseInt(e.target.value) })}
                          className="flex-grow accent-primary"
                        />
                        <div className="w-20 py-2 bg-bg-primary rounded-lg text-center font-mono text-primary font-bold border border-primary/20">
                          {formData.min_reputation}
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-text-tertiary mt-2 uppercase tracking-widest">
                        <span>Open Entry</span>
                        <span>Elite Status</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <label className="block text-sm font-medium text-text-secondary">Brief Description</label>
                       <textarea 
                        className="w-full bg-bg-primary border border-border-color rounded-xl p-4 text-white focus:ring-1 focus:ring-primary outline-none min-h-[120px]"
                        placeholder="Tell students what your organization is about..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                       />
                    </div>

                    <div className="flex justify-between gap-4">
                      <Button type="button" variant="secondary" onClick={prevStep}>Back</Button>
                      <Button type="submit" variant="primary" loading={loading} className="flex-grow">
                        Launch Organization <Zap size={18} className="ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-8 flex items-center justify-center gap-8 text-text-tertiary">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500" />
            <span className="text-xs">Verified Domain</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-500" />
            <span className="text-xs">Instant Setup</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-blue-500" />
            <span className="text-xs">Public Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
