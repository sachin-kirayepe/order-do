import { motion } from 'framer-motion';
import { Heart, Store, Mic, Zap, Bell, Shield, ArrowLeft, Globe, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/ui/Footer';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';

const shopTypes = [
  { name: 'Kirana Stores', nameHi: 'किराना दुकान' },
  { name: 'General Shops', nameHi: 'जनरल स्टोर्स' },
  { name: 'Pan Shops', nameHi: 'पान की दुकान' },
  { name: 'Tea Stalls', nameHi: 'चाय की टपरी' },
  { name: 'Restaurants', nameHi: 'रेस्टोरेंट' },
  { name: 'Sweet Shops', nameHi: 'मिठाई की दुकान' }
];

const features = [
  {
    icon: <Mic className="text-brand-secondary" />,
    title: 'Regional Voice Support',
    desc: 'Order in your own language, naturally and effortlessly.'
  },
  {
    icon: <Shield className="text-brand-primary" />,
    title: 'Identity Verification',
    desc: 'Live photo capture for secure daily transactions and trust.'
  },
  {
    icon: <Bell className="text-brand-primary" />,
    title: 'Fast Notifications',
    desc: 'Know the moment a new order arrives at your shop with low latency.'
  },
  {
    icon: <Zap className="text-brand-secondary" />,
    title: 'Instant Setup',
    desc: 'Launch your digital shop in less than 2 minutes with zero friction.'
  }
];

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-primary/30">
      {/* Background Aesthetic Nodes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/5 blur-[120px] rounded-full -ml-40 -mb-40 pointer-events-none" />

      {/* Navigation Header */}
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
             <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">The <span className="text-brand-primary italic">Story</span></h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Order-Do Origins</p>
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20 md:py-32 space-y-32 md:space-y-48">
        {/* 1. Hero Section */}
        <section className="text-center space-y-10 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-primary/10 blur-[100px] rounded-full -z-10" />
           
           <motion.div
             initial={{ opacity: 0, scale: 0.9, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             className="inline-block p-8 bg-white/5 rounded-[3rem] border border-white/10 shadow-glow-green/5 mb-8"
           >
             <img src="/logo.png" alt="Order-Do" className="w-24 h-24 object-contain mx-auto brightness-110" />
           </motion.div>

           <div className="space-y-6">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-7xl font-black text-white leading-none uppercase italic tracking-tighter"
              >
                Order-<span className="text-brand-primary">Do</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg md:text-2xl font-black text-brand-secondary uppercase tracking-[0.15em] italic"
              >
                "Snap, Speak, and Settle — Pure Simplicity."
              </motion.p>
           </div>

           <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="max-w-3xl mx-auto text-slate-300 text-lg md:text-xl font-bold leading-relaxed"
           >
             A precision-engineered, voice-first platform designed to empower the pulse of Indian commerce—the kirana stores and small enterprises.
           </motion.p>
        </section>

        {/* 2. Our Narrative */}
        <section className="grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-10">
             <div className="space-y-4">
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.5em] leading-none mb-2 block">Our Narrative</span>
                <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4 leading-none">
                  Empowering the Heart of India
                </h3>
             </div>
             
             <div className="space-y-8 text-slate-400 text-lg font-bold leading-relaxed">
               <p>
                 Order-Do was born from a singular vision: to bridge the gap between world-class technology and the localized needs of Indian micro-entrepreneurs. We witnessed long queues, manual accounting errors, and the friction of digital adoption in fast-paced retail environments.
               </p>
               <p>
                 Complexity was the enemy. We decided to eliminate it. By leveraging voice, photos, and high-fidelity glass interfaces, we created a system that feels as natural as a conversation across the counter.
               </p>
             </div>
          </div>
          
          <div className="lg:col-span-5">
             <GlassCard intensity="high" className="p-12 border-brand-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                   <Globe size={150} />
                </div>
                <p className="text-brand-primary font-black italic text-2xl leading-tight text-center relative z-10">
                  "हमारा लक्ष्य है भारत के हर छोटे दुकानदार को आधुनिक तकनीक से जोड़ना, बिना उनकी सरलता को खोए।"
                </p>
                <div className="mt-8 flex items-center justify-center gap-2 opacity-40">
                   <div className="w-10 h-px bg-brand-primary/50" />
                   <span className="text-[9px] font-black uppercase tracking-widest italic">The Founder's Vision</span>
                   <div className="w-10 h-px bg-brand-primary/50" />
                </div>
             </GlassCard>
          </div>
        </section>

        {/* 3. Core Values */}
        <section className="grid md:grid-cols-2 gap-10">
          <GlassCard intensity="low" className="p-12 border-brand-primary/20 space-y-8 flex flex-col justify-between group hover:bg-brand-primary/5 transition-all">
             <div className="space-y-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-glow-green/10 group-hover:scale-110 transition-transform">
                   <Heart size={32} fill="currentColor" />
                </div>
                <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Our Mission</h4>
                <p className="text-slate-400 font-bold text-lg leading-relaxed">
                  To synthesize cutting-edge tech into simple, invisible tools that save time and amplify prosperity for every shopkeeper.
                </p>
             </div>
             <div className="h-px bg-white/5 w-full" />
             <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.4em] italic opacity-40">Persistence & Empathy</span>
          </GlassCard>

          <GlassCard intensity="low" className="p-12 border-brand-secondary/20 space-y-8 flex flex-col justify-between group hover:bg-brand-secondary/5 transition-all">
             <div className="space-y-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-brand-secondary/10 flex items-center justify-center text-brand-secondary border border-brand-secondary/20 shadow-glow-secondary/10 group-hover:scale-110 transition-transform">
                   <Zap size={32} fill="currentColor" />
                </div>
                <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Our Vision</h4>
                <p className="text-slate-400 font-bold text-lg leading-relaxed">
                   A future where every QR code represents a high-fidelity digital interaction that understands the merchant's voice.
                </p>
             </div>
             <div className="h-px bg-white/5 w-full" />
             <span className="text-[9px] font-black text-brand-secondary uppercase tracking-[0.4em] italic opacity-40">Velocity & Innovation</span>
          </GlassCard>
        </section>

        {/* 4. Ecosystem Fit */}
        <section className="space-y-20">
          <div className="text-center space-y-4">
             <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.5em] italic">Universal Node Support</span>
             <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Designed for the Entire Ecosystem</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {shopTypes.map((type, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10, scale: 1.05 }}
                className="group"
              >
                <GlassCard intensity="low" className="h-40 p-8 border-white/10 flex flex-col items-center justify-center text-center group-hover:border-brand-primary/40 transition-all shadow-hover cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-brand-primary group-hover:scale-110 group-hover:rotate-6 transition-all">
                     <Store size={22} />
                  </div>
                  <span className="font-black text-white uppercase italic tracking-tighter text-xs group-hover:text-brand-primary transition-colors">{type.name}</span>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-2">{type.nameHi}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 5. Telemetry & Performance */}
        <section className="space-y-20">
           <div className="text-center space-y-4">
             <span className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.5em] italic">Precision Metrics</span>
             <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Core Engineering Excellence</h3>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <GlassCard key={i} intensity="low" className="p-10 border-white/5 space-y-6 group hover:translate-y-[-8px] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-white/5 shadow-inner flex items-center justify-center border border-white/10 group-hover:shadow-glow-green/10 transition-all">
                  {f.icon}
                </div>
                <div>
                   <h5 className="font-black text-white uppercase italic text-sm tracking-tight mb-3 group-hover:text-brand-primary transition-colors">{f.title}</h5>
                   <p className="text-slate-500 text-[11px] font-bold leading-relaxed uppercase tracking-tighter italic">{f.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* 6. Signature */}
        <section className="text-center py-32 relative overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />
           
           <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             whileInView={{ scale: 1, opacity: 1 }}
             viewport={{ once: true }}
             className="space-y-12 relative z-10"
           >
              <div className="inline-flex items-center justify-center gap-3 px-8 py-3 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20 shadow-glow-green/5">
                <Sparkles size={18} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Initialization Complete</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-2xl mx-auto uppercase italic tracking-tighter">
                "Crafted with <Heart size={32} fill="#22c55e" className="inline mx-2 mb-2 animate-pulse" /> for the Pillars of Indian Commerce."
              </h2>
              
              <div className="pt-10">
                 <Button 
                   onClick={() => navigate('/shop/register')}
                   variant="primary"
                   className="h-16 px-12 !rounded-[2rem] shadow-glow-green text-[10px] font-black uppercase tracking-[0.5em] italic"
                 >
                    Join the Network
                 </Button>
              </div>
           </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
