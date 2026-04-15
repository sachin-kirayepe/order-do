import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MessageSquare, Send, CheckCircle, AlertCircle, ArrowLeft, Globe, HelpCircle, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/ui/Footer';
import { supabase } from '../lib/supabase';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ContactUs() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const subjects = [
    'General Inquiry',
    'Technical Support / Bug Report',
    'Shopkeeper Related Issue',
    'Customer Feedback',
    'Feature Request',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError('PROTOCOL ERROR: Mandatory telemetry data missing.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await supabase
        .from('contact_messages')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject,
          message: formData.message
        }]);

      if (submitError) throw submitError;

      setSubmitted(true);
      setLoading(false);
    } catch (err: any) {
      console.error('Contact form error:', err);
      setError('LINK FAILURE: System rejected transmission. Retry.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-primary/30 overflow-hidden">
      {/* Immersive Background Aesthetic */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/5 blur-[120px] rounded-full -ml-40 -mb-40 pointer-events-none" />

      {/* Header */}
      <header className="h-20 flex items-center px-8 bg-slate-900/40 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-6 max-w-7xl mx-auto w-full">
           <Button 
             variant="ghost" 
             onClick={() => navigate(-1)}
             className="w-12 h-12 !p-0 !rounded-xl bg-white/5 text-slate-400 hover:text-white"
           >
             <ArrowLeft size={24} />
           </Button>
           <div className="flex flex-col">
             <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Access <span className="text-brand-primary italic">Relay</span></h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Support & Network Inquiries</p>
           </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20 lg:py-32 relative">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          {/* Left Column: Communications Hub Info */}
          <div className="lg:col-span-5 space-y-16">
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-3 px-4 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20 text-[9px] font-black uppercase tracking-widest italic"
              >
                 <Radio size={12} className="animate-pulse" /> Global Support Node
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-black text-white leading-none uppercase italic tracking-tighter"
              >
                Initiate <span className="text-brand-primary">Uplink</span>
              </motion.h2>
              <p className="text-lg text-slate-400 font-bold leading-relaxed italic pr-6 focus:text-white transition-colors">
                Transmission protocols are active. Whether you're optimizing your storefront or experience a sync failure, our specialists are ready to respond.
              </p>
            </div>

            <div className="grid gap-4">
              <ContactCard 
                icon={Mail} 
                label="Direct Transmission" 
                value="sachinkumar647422.office@gmail.com" 
                sub="SLA: &lt; 24 Hour Relay"
                accent="brand-primary"
              />
              <ContactCard 
                icon={MessageSquare} 
                label="WhatsApp Protocol" 
                value="Secure Link Pending" 
                sub="Initialization phase"
                accent="brand-secondary"
                disabled
              />
              <ContactCard 
                icon={Globe} 
                label="Network Origin" 
                value="Digital India | Global Reach" 
                sub="Core Development Nexus"
                accent="blue-500"
              />
            </div>

            <GlassCard intensity="low" className="p-8 border-white/5 border-dashed border-2 flex items-start gap-4 group hover:border-brand-primary/20 transition-all cursor-help">
              <HelpCircle size={24} className="text-slate-500 shrink-0 mt-1 group-hover:text-brand-primary transition-colors" />
              <div className="space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Diagnostic Archives</p>
                 <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-tighter italic">
                   Check our Knowledge Repository before transmission for instantaneous protocol assistance.
                 </p>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Transmission Form */}
          <div className="lg:col-span-7 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-[3.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            
            <GlassCard intensity="high" className="p-10 md:p-14 border-white/20 dark:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onSubmit={handleSubmit} 
                    className="space-y-10"
                  >
                    <div className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Name */}
                        <Input 
                          label="Identifier (Name)" 
                          name="name" 
                          required 
                          value={formData.name} 
                          onChange={handleChange} 
                          placeholder="Protagonist Name"
                          className="bg-white/10 border-white/10 focus:border-brand-primary text-xs font-black uppercase tracking-widest"
                          labelClassName="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1"
                        />
                        {/* Email */}
                        <Input 
                          label="Digital Address (Email)" 
                          name="email" 
                          type="email" 
                          required 
                          value={formData.email} 
                          onChange={handleChange} 
                          placeholder="nexus@hub.com"
                          className="bg-white/10 border-white/10 focus:border-brand-primary text-xs font-black uppercase tracking-widest"
                          labelClassName="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Phone */}
                        <Input 
                          label="Voice Link (Optional)" 
                          name="phone" 
                          type="tel" 
                          value={formData.phone} 
                          onChange={handleChange} 
                          placeholder="+91 XXXXX XXXXX"
                          className="bg-white/10 border-white/10 focus:border-brand-primary text-xs font-black uppercase tracking-widest"
                          labelClassName="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1"
                        />
                        {/* Subject */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Relay Classification</label>
                          <select
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full h-14 px-6 bg-white/10 border-2 border-white/5 focus:border-brand-primary rounded-2xl outline-none transition-all text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white appearance-none cursor-pointer"
                          >
                            {subjects.map(s => <option key={s} value={s} className="bg-slate-900">{s.toUpperCase()}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Message */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Payload Telemetry (Message)</label>
                        <textarea
                          name="message"
                          required
                          rows={4}
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Specify the parameters of your inquiry..."
                          className="w-full p-8 bg-white/10 border-2 border-white/5 focus:border-brand-primary rounded-[2.5rem] outline-none transition-all text-sm font-bold placeholder-slate-600 text-slate-800 dark:text-white resize-none shadow-inner"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                       {error && (
                         <motion.div 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl"
                         >
                           <AlertCircle size={18} className="text-red-500" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>
                         </motion.div>
                       )}
                    </AnimatePresence>

                    <Button
                      disabled={loading}
                      variant="primary"
                      className="w-full h-20 !rounded-[2rem] shadow-glow-green text-sm font-black uppercase italic tracking-[0.3em] relative group/btn"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Execute Transmission
                          <Send size={24} className="ml-4 group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 transition-transform" />
                        </>
                      )}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    className="text-center py-20 px-4 space-y-10"
                  >
                    <div className="w-24 h-24 bg-brand-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-brand-primary/20 shadow-glow-green/20 relative">
                       <CheckCircle size={56} className="text-brand-primary" />
                       <motion.div 
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-brand-primary/10 rounded-[2.5rem] -z-10"
                      />
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Uplink Confirmed</h3>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs leading-relaxed max-w-sm mx-auto">
                        Your telemetry payload has been synchronized with the core relay. Expected response frame: &lt; 24h.
                      </p>
                    </div>
                    <Button 
                      variant="ghost"
                      onClick={() => setSubmitted(false)}
                      className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary hover:bg-brand-primary/10 px-8 py-4 !rounded-xl"
                    >
                      Transmit Additional Payload
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ContactCard({ icon: Icon, label, value, sub, accent, disabled }: any) {
  return (
    <div className={`p-8 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-inner flex items-center gap-6 group hover:border-white/20 transition-all ${disabled ? 'opacity-50 select-none grayscale' : 'cursor-pointer'}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all bg-${accent}/10 text-${accent} border border-${accent}/20 shadow-inner group-hover:scale-110`}>
        <Icon size={28} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 leading-none">{label}</h4>
        <p className="text-sm font-black text-white uppercase italic tracking-tighter whitespace-nowrap leading-tight mb-2">{value}</p>
        <p className={`text-[8px] font-black uppercase tracking-widest ${accent ? `text-${accent}` : 'text-slate-400'} italic`}>{sub}</p>
      </div>
    </div>
  );
}
