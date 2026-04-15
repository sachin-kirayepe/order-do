import { motion } from 'framer-motion';
import { 
  Star, 
  Quote, 
  Users, 
  Store, 
  TrendingUp, 
  ArrowRight, 
  ArrowLeft,
  Heart,
  MapPin,
  Sparkles,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/ui/Footer';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Kirana Store Owner",
    location: "Prayagraj, UP",
    rating: 5,
    text: "Pehle har order likhne mein bahut time lagta tha. Ab Order-Do se bas QR scan karo aur voice se order aa jata hai. Daily 2 ghante bachte hain!",
    initials: "RK",
    accent: "brand-primary"
  },
  {
    name: "Priya Sharma",
    role: "Regular Customer",
    location: "Lucknow, UP",
    rating: 5,
    text: "Voice ordering is so easy! Mere ghar ke elder log bhi asani se bol kar list bhej dete hain. Photo verification se trust bhi bana rehta hai.",
    initials: "PS",
    accent: "brand-secondary"
  },
  {
    name: "Amit Patel",
    role: "Restaurant Manager",
    location: "Ahmedabad, Gujarat",
    rating: 4.5,
    text: "Table-wise ordering feature is a lifesaver. Customers scan karte hain aur humein seedha kitchen mein notification mil jata hai. Very professional!",
    initials: "AP",
    accent: "blue-500"
  },
  {
    name: "Suresh Gupta",
    role: "General Store Owner",
    location: "Delhi, NCR",
    rating: 5,
    text: "Mera chota sa kaam hai par Order-Do ne ise modern bana diya. Free plan se shuru kiya tha, ab business badh gaya hai. Highly recommended!",
    initials: "SG",
    accent: "brand-primary"
  },
  {
    name: "Meena Devi",
    role: "Small Tea Stall",
    location: "Varanasi, UP",
    rating: 5,
    text: "QR code lagane ke baad se bheed kam ho gayi hai. Log scan karte hain aur apna order bol dete hain. Mobile par turant awaaz aati hai!",
    initials: "MD",
    accent: "amber-500"
  },
  {
    name: "Vikram Singh",
    role: "Grocery Shop Owner",
    location: "Jaipur, Rajasthan",
    rating: 4.5,
    text: "Best part is the regional language support. Mere customers apni bhasha mein bolte hain aur system sahi se samajh leta hai. Magic hai ye!",
    initials: "VS",
    accent: "brand-secondary"
  },
  {
    name: "Anjali Roy",
    role: "Office Worker / Customer",
    location: "Kolkata, WB",
    rating: 5,
    text: "Lunch break mein order dena ab fast ho gaya hai. Bas photo lo aur items bolo. Dukaan pahunchne tak order pack milta hai. Great app!",
    initials: "AR",
    accent: "indigo-500"
  },
  {
    name: "Mohammad Zaid",
    role: "Bakery Owner",
    location: "Mumbai, Maharashtra",
    rating: 5,
    text: "Order-Do dashboard se sab kuch manage karna easy hai. Payments track karna aur daily reports dekhna ab ek click ka kaam hai.",
    initials: "MZ",
    accent: "slate-400"
  }
];

const stats = [
  { icon: <Store className="text-brand-primary" />, label: "500+", sublabel: "Nodes Active" },
  { icon: <TrendingUp className="text-blue-500" />, label: "10,000+", sublabel: "Payload Deliveries" },
  { icon: <Users className="text-brand-secondary" />, label: "5,000+", sublabel: "Verified Identities" },
  { icon: <Star className="text-amber-500" />, label: "4.8", sublabel: "Reliability Index" }
];

export default function Testimonials() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-primary/30 overflow-hidden">
      {/* Immersive Background Nodes */}
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
             <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Social <span className="text-brand-primary italic">Proof</span></h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Network Resonance & Trust</p>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32 space-y-32 md:space-y-48 relative">
        {/* Hero Section */}
        <section className="text-center space-y-12 relative max-w-4xl mx-auto">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-primary/10 blur-[100px] rounded-full -z-10" />
           
           <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 bg-brand-primary/10 rounded-[2.2rem] flex items-center justify-center mx-auto border border-brand-primary/20 shadow-glow-green/10 text-brand-primary animate-pulse"
           >
              <Heart size={40} fill="currentColor" />
           </motion.div>

           <div className="space-y-6">
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-8xl font-black text-white leading-none uppercase italic tracking-tighter"
              >
                The Impact <br/>
                <span className="text-brand-primary">Synthesized</span>
              </motion.h2>
              <p className="text-lg md:text-2xl text-slate-400 font-bold max-w-3xl mx-auto italic leading-relaxed">
                Empirical evidence from the merchants and consumers who have successfully integrated the Nexus into their daily operational routines.
              </p>
           </div>
        </section>

        {/* Impact Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
           {stats.map((stat, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
             >
                <GlassCard intensity="low" className="p-10 border-white/5 text-center space-y-4 shadow-inner group hover:border-brand-primary/20 transition-all">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:shadow-glow-green/10">
                     {stat.icon}
                  </div>
                  <h4 className="text-4xl font-black text-white tracking-widest leading-none italic uppercase group-hover:text-brand-primary transition-colors break-all">{stat.label}</h4>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">{stat.sublabel}</p>
                </GlassCard>
             </motion.div>
           ))}
        </section>

        {/* Testimonial Grid */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           {testimonials.map((t, idx) => (
             <motion.div
               key={idx}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.05 }}
             >
                <GlassCard
                  intensity="low"
                  className="p-10 flex flex-col h-full border-white/5 relative group hover:border-brand-primary/30 transition-all cursor-default overflow-hidden"
                >
                  <Quote className="absolute top-8 right-8 text-white/5 transition-all group-hover:text-brand-primary/10 group-hover:scale-110" size={80} />
                  
                  <div className="space-y-8 relative z-10 flex flex-col h-full">
                     <div className="flex items-center gap-1.5 focus:scale-110 transition-transform">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            className={i < Math.floor(t.rating) ? "text-brand-primary fill-brand-primary" : "text-slate-700"} 
                          />
                        ))}
                     </div>

                     <p className="text-[17px] font-bold text-slate-400 leading-relaxed italic group-hover:text-white transition-colors">
                        "{t.text}"
                     </p>

                     <div className="mt-auto pt-8 border-t border-white/5 flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-2xl relative overflow-hidden group/avatar`}>
                           <div className={`absolute inset-0 opacity-20 bg-brand-primary`} />
                           <div className="relative z-10 text-lg italic">{t.initials}</div>
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                           <h5 className="font-black text-white uppercase italic tracking-tighter truncate text-lg leading-none mb-2">{t.name}</h5>
                           <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest italic leading-none">{t.role}</span>
                              <p className="text-[8px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest italic leading-none opacity-60">
                                <MapPin size={10} className="text-brand-secondary" /> {t.location}
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
                  
                  {/* Subtle Accent Glow */}
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity bg-brand-primary`} />
                </GlassCard>
             </motion.div>
           ))}
        </section>

        {/* Global Connection CTA */}
        <section className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary border-brand-primary/20 to-brand-secondary border-brand-secondary/20 rounded-[4.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
           
           <GlassCard intensity="high" className="p-16 md:p-32 text-center space-y-16 relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 left-0 w-full h-full bg-brand-primary/5 blur-[130px] rounded-full pointer-events-none" />
              
              <div className="w-24 h-24 bg-brand-primary/10 rounded-[2.5rem] border border-brand-primary/20 flex items-center justify-center text-brand-primary mb-6 animate-spin-slow">
                 <Globe size={48} />
              </div>

              <div className="space-y-8 max-w-3xl">
                <h3 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Initialize <span className="text-brand-primary">Growth</span> Protocol</h3>
                <p className="text-slate-400 font-bold text-xl italic leading-relaxed">
                  Thousands of independent nodes are already operational. Secure your shop's digital identity and start processing payloads instantly.
                </p>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-8 w-full max-w-xl">
                 <Button 
                   onClick={() => navigate('/shop/register')}
                   variant="primary"
                   className="h-20 flex-1 !rounded-[2rem] shadow-glow-green text-sm font-black uppercase italic tracking-[0.4em] group"
                 >
                    Initialize Node
                    <ArrowRight size={24} className="ml-4 group-hover:translate-x-2 transition-transform" />
                 </Button>
                 <Button 
                    onClick={() => navigate('/how-it-works')}
                    variant="ghost"
                    className="h-20 flex-1 !rounded-[2.2rem] bg-white/5 border border-white/10 text-slate-300 font-black uppercase italic tracking-[0.3em] hover:bg-white/10"
                 >
                    Study Framework
                 </Button>
              </div>
           </GlassCard>
        </section>

        {/* Distributed Ledger Info */}
        <div className="flex flex-col items-center gap-6 pt-10 opacity-30">
           <div className="flex items-center gap-3">
              <Sparkles size={14} className="text-brand-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Collective Intelligence Sync: Active</span>
              <Sparkles size={14} className="text-brand-primary" />
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Secure Protocol Ledger // Testimonials Collective v2.1</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
