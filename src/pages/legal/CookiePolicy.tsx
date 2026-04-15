import { motion } from 'framer-motion';
import { Cookie, ShieldCheck, Database, HardDrive, Trash2, HelpCircle, EyeOff, Info, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/ui/Footer';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';

export default function CookiePolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. What are Cookies & Local Storage?",
      icon: <Cookie className="text-brand-secondary" />,
      content: "Think of cookies and local storage as a tiny digital notebook on your phone or computer. The 'Order-Do' app uses this notebook to remember your settings and orders so the app works fast and smoothly for you."
    },
    {
      title: "2. Types of Data Storage We Use",
      icon: <Info className="text-blue-500" />,
      content: "• Essential Storage: Needed for the app to open and function.\n• Preference Storage: Remembers your language (English/Hindi), voice settings, and if you muted the sound.\n• Temporary Order Data: Keeps your current order items and photo while the order is being processed."
    },
    {
      title: "3. What We Store and Why",
      icon: <ShieldCheck className="text-brand-primary" />,
      content: "• Live Photos: Only for order verification. Deleted once the order is done.\n• Order Details: Converted from your voice into text to create your list.\n• Name & Phone: To identify your order at the shop.\n\nWe do NOT sell your data to anyone. Your trust is more important to us than anything else."
    },
    {
      title: "4. Local Storage vs Supabase",
      icon: <Database className="text-indigo-500" />,
      content: "Most of your information (like photos and order lists) stays locally on YOUR device. Only your secure login info is kept on our Supabase servers. This way, your data stays within your control as much as possible."
    },
    {
      title: "5. Third-Party Services",
      icon: <EyeOff className="text-slate-400" />,
      content: "Right now, we do not use any third-party advertising cookies. If we add services like Google AdSense in the future, we will update this policy and let you know."
    },
    {
      title: "6. Manage or Delete Your Data",
      icon: <Trash2 className="text-red-500" />,
      content: "You can clear your browser cache or uninstall the PWA to remove all local data. If you want us to delete any specific account data, just email us."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-primary/30 overflow-hidden">
      {/* Immersive Background Nodes */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-primary/5 blur-[100px] rounded-full -ml-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-secondary/5 blur-[100px] rounded-full -mr-20 -mb-20 pointer-events-none" />

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
             <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Storage <span className="text-brand-primary italic">Manifest</span></h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Cookie & Local Repository Policy</p>
           </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 space-y-16 relative">
        {/* Intro Directive */}
        <section className="text-center space-y-10 max-w-3xl mx-auto">
           <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-brand-primary border border-brand-primary/20 shadow-glow-green/10"
           >
              <HardDrive size={40} className="animate-pulse" />
           </motion.div>
           
           <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic leading-none tracking-tighter">
                Transparent <span className="text-brand-primary">Repository</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-300 font-bold leading-relaxed">
                Hum aapka data utna hi store karte hain jitna app ko chalane ke liye zaroori hai. Koi fizool tracking nahi, koi data bechna nahi.
              </p>
           </div>
        </section>

        {/* Operational Sections */}
        <div className="grid md:grid-cols-2 gap-8">
           {sections.map((s, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 15 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.05 }}
             >
                <GlassCard intensity="low" className="p-10 border-white/5 hover:border-brand-primary/20 transition-all flex flex-col h-full group">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                      {s.icon}
                   </div>
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-4 group-hover:text-brand-primary transition-colors">
                     {s.title}
                   </h3>
                   <p className="text-sm text-slate-400 font-bold leading-relaxed whitespace-pre-line group-hover:text-slate-300 transition-colors">
                     {s.content}
                   </p>
                </GlassCard>
             </motion.div>
           ))}
        </div>

        {/* Extra Relay Hub */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="relative group"
        >
           <div className="absolute -inset-1 bg-gradient-to-r from-brand-secondary/20 to-brand-primary/20 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
           <GlassCard intensity="high" className="p-12 border-brand-secondary/20 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/5 blur-3xl rounded-full" />
              
              <div className="p-5 bg-brand-secondary/10 rounded-3xl text-brand-secondary border border-brand-secondary/20 shadow-glow-secondary/5">
                 <HelpCircle size={40} />
              </div>
              <div className="space-y-4 text-center md:text-left">
                 <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Persistent Queries?</h4>
                 <p className="text-slate-400 font-bold text-lg leading-relaxed">
                   If you are worried about your data privacy, please email us directly at 
                   <span className="text-white block mt-1 underline decoration-brand-secondary decoration-2 underline-offset-4 whitespace-nowrap tracking-tighter text-sm">sachinkumar647422.office@gmail.com</span>. 
                   Hum aapke saare doubts door karenge.
                 </p>
              </div>
           </GlassCard>
        </motion.div>

        {/* Diagnostic Footer Info */}
        <div className="flex flex-col items-center gap-6 pt-10 border-t border-white/5 opacity-30">
           <div className="flex items-center gap-3 text-brand-primary">
              <Sparkles size={14} className="animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Consent Framework v2.1</span>
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Secure Peripheral Archive // India Core</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
