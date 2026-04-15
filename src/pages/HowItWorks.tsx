import { motion } from 'framer-motion';
import { 
  QrCode, 
  Camera, 
  Mic, 
  CheckCircle, 
  Play, 
  Store, 
  Zap, 
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Search,
  MessageSquare,
  ShieldCheck,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/ui/Footer';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';

const customerSteps = [
  {
    id: 1,
    title: 'Scan QR Code',
    titleHi: 'QR कोड स्कैन करें',
    desc: 'Just scan the encrypted code at the shop counter or your table.',
    icon: <QrCode size={24} className="text-brand-primary" />
  },
  {
    id: 2,
    title: 'Secure Context',
    titleHi: 'सेल्फी लें',
    desc: 'A quick live photo for security and identity verification.',
    icon: <Camera size={24} className="text-brand-secondary" />
  },
  {
    id: 3,
    title: 'Voice Identity',
    titleHi: 'अपना नाम बताएं',
    desc: 'Voice entry for your identifier and delivery parameters.',
    icon: <MessageSquare size={24} className="text-blue-500" />
  },
  {
    id: 4,
    title: 'Order Transmission',
    titleHi: 'ऑर्डर बोलें',
    desc: 'Talk naturally! Say "Ek Chai aur Biscuit" — our AI gets it.',
    icon: <Mic size={24} className="text-indigo-500" />
  },
  {
    id: 5,
    title: 'Review Payload',
    titleHi: 'ऑर्डर चेक करें',
    desc: 'See the items on your screen to verify the data stream.',
    icon: <Search size={24} className="text-brand-secondary" />
  },
  {
    id: 6,
    title: 'Finalize Link',
    titleHi: 'ऑर्डर भेजें',
    desc: 'Execute transmission. The merchant node is notified instantly.',
    icon: <CheckCircle size={24} className="text-brand-primary" />
  }
];

const benefits = [
  { icon: <Zap size={20} />, text: 'Zero Manual Entry' },
  { icon: <Smartphone size={20} />, text: 'Universal Access' },
  { icon: <Mic size={20} />, text: 'Natural Language' },
  { icon: <ShieldCheck size={20} className="text-brand-primary" />, text: 'Identity Verified' }
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-primary/30">
      {/* Immersive Background Nodes */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full -ml-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-secondary/5 blur-[120px] rounded-full -mr-40 -mb-40 pointer-events-none" />

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
             <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Operation <span className="text-brand-primary italic">Protocol</span></h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">System Architecture & Flow</p>
           </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20 lg:py-32 space-y-32 md:space-y-48">
        {/* 1. Hero Section */}
        <section className="text-center space-y-12 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-primary/10 blur-[130px] rounded-full -z-10" />
           
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-3 px-6 py-2 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20 text-[10px] font-black uppercase tracking-[0.4em] italic mb-6 animate-pulse"
           >
              <Cpu size={14} className="text-brand-primary" /> Active Synchronization
           </motion.div>

           <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black text-white leading-none uppercase italic tracking-tighter"
           >
             The Fluid <br/>
             <span className="text-brand-primary">Nexus Workflow</span>
           </motion.h2>

           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="text-lg md:text-2xl text-slate-400 font-bold max-w-3xl mx-auto italic leading-relaxed"
           >
             Eliminating friction through voice-first engineering and verified identity protocols. Instant commerce for the modern era.
           </motion.p>
           
           <div className="pt-8">
              <Button 
                variant="primary"
                className="h-20 px-12 !rounded-[2.5rem] shadow-glow-green text-sm font-black uppercase italic tracking-[0.3em] group"
              >
                 <Play size={20} fill="currentColor" className="mr-4 group-hover:scale-110 transition-transform" />
                 View Simulation
              </Button>
           </div>
        </section>

        {/* 2. For Customers - Protocol Steps */}
        <section className="space-y-24">
           <div className="flex items-center justify-between gap-8 border-b border-white/10 pb-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-[1.5rem] flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-glow-green/10">
                  <Smartphone size={32} />
                </div>
                <div>
                   <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">Customer Uplink</h3>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">External User Flow</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3 opacity-30">
                 <Fingerprint size={20} className="text-brand-primary" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Biometric Secure</span>
              </div>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {customerSteps.map((step, idx) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard
                    intensity="low"
                    className="p-10 border-white/5 relative group hover:border-brand-primary/20 transition-all cursor-default"
                  >
                     <div className="absolute -top-5 -left-5 w-12 h-12 bg-slate-900 border-2 border-brand-primary/30 rounded-2xl flex items-center justify-center font-black text-brand-primary shadow-glow-green/10 italic text-lg z-10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                        {step.id}
                     </div>
                     <div className="mb-8 w-14 h-14 rounded-2xl bg-white/5 shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform border border-white/5">
                        {step.icon}
                     </div>
                     <h4 className="font-black text-white uppercase italic mb-2 tracking-tighter text-xl group-hover:text-brand-primary transition-colors">
                        {step.title}
                     </h4>
                     <p className="text-[10px] font-black text-brand-secondary/60 uppercase tracking-widest mb-6">
                        {step.titleHi}
                     </p>
                     <p className="text-slate-500 font-bold text-sm leading-relaxed italic group-hover:text-slate-400 transition-colors">
                        {step.desc}
                     </p>
                  </GlassCard>
                </motion.div>
              ))}
           </div>
        </section>

        {/* 3. For Shopkeepers - Core Operations */}
        <section className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary border-brand-primary/20 to-brand-secondary border-brand-secondary/20 rounded-[4.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
           
           <GlassCard intensity="high" className="p-16 md:p-24 border-brand-primary/20 space-y-20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 blur-[130px] rounded-full pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-16 relative">
                 <div className="space-y-8 max-w-xl">
                    <div className="space-y-4">
                       <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.5em] italic">Internal Node Hub</span>
                       <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none flex items-center gap-6">
                          <Store className="text-brand-primary shrink-0" size={48} />
                          Merchant Nexus
                       </h3>
                    </div>
                    <p className="text-slate-400 font-bold text-xl italic leading-relaxed">
                      Optimize your internal architecture with real-time telemetry, voice-orchestrated alerts, and high-fidelity billing protocols.
                    </p>
                 </div>
                 <Button 
                   variant="primary"
                   onClick={() => navigate('/shop/register')}
                   className="h-20 px-12 !rounded-[2.5rem] shadow-glow-green text-sm font-black uppercase italic tracking-[0.3em] group"
                 >
                    Initialize Node
                    <ArrowRight size={24} className="ml-4 group-hover:translate-x-2 transition-transform" />
                 </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 relative">
                 {[
                   { title: 'QR Generation', desc: 'Synthesize unique endpoint IDs for instant customer discovery.' },
                   { title: 'Aural Feedback', desc: 'Secure voice relay protocols and high-fidelity delivery alerts.' },
                   { title: 'Interactive KDS', desc: 'High-density payload visualization for optimized kitchen execution.' },
                   { title: 'Digital Settlement', desc: 'Instant financial reconciliation and encrypted receipt distribution.' },
                   { title: 'Synchronized Ledger', desc: 'Real-time database persistence with automatic sync across nodes.' }
                 ].map((item, i) => (
                   <div key={i} className="space-y-4 border-l-2 border-brand-primary/20 pl-8 group/item hover:border-brand-primary transition-colors">
                      <h5 className="font-black text-white uppercase italic tracking-tight text-lg group-hover/item:text-brand-primary transition-colors">{item.title}</h5>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter italic leading-relaxed group-hover/item:text-slate-400 transition-colors">{item.desc}</p>
                   </div>
                 ))}
              </div>
           </GlassCard>
        </section>

        {/* 4. Infrastructure Performance */}
        <section className="text-center space-y-24">
           <div className="space-y-4">
              <span className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.5em] italic">System Integrity</span>
              <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Why Order-Do Infrastructure?</h3>
           </div>
           
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((b, i) => (
                <GlassCard key={i} intensity="low" className="p-10 border-white/5 space-y-6 group hover:translate-y-[-10px] transition-all">
                   <div className="w-14 h-14 bg-white/5 rounded-2xl shadow-inner flex items-center justify-center mx-auto text-brand-primary border border-white/5 group-hover:shadow-glow-green/10 transition-all">
                      {b.icon}
                   </div>
                   <p className="font-black text-white uppercase italic tracking-tight text-sm group-hover:text-brand-primary transition-colors">{b.text}</p>
                </GlassCard>
              ))}
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
