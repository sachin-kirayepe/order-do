import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Search, MessageSquare, ShoppingBag, ArrowLeft, Cpu, WifiOff } from 'lucide-react';
import Footer from '../components/ui/Footer';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-primary/30 flex flex-col overflow-hidden">
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
             <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Status <span className="text-brand-secondary italic">404</span></h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Node Dissolution Detected</p>
           </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-16 py-20 relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-primary/10 blur-[130px] rounded-full -z-10 opacity-30" />

         {/* Illusion/Diagnostic Visualization */}
         <div className="relative group">
            <motion.div
               initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
               animate={{ opacity: 1, scale: 1, rotate: 0 }}
               transition={{ type: 'spring', damping: 20 }}
            >
               <GlassCard intensity="high" className="w-48 h-48 rounded-[3.5rem] flex items-center justify-center border-brand-secondary/30 relative z-10 shadow-glow-secondary/10 group-hover:scale-105 transition-transform duration-500">
                  <div className="relative">
                     <ShoppingBag size={80} className="text-brand-secondary opacity-10 animate-pulse-slow" />
                     <WifiOff size={56} className="text-brand-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-glow" />
                  </div>
               </GlassCard>
            </motion.div>
            
            {/* Animated Particles */}
            <motion.div 
               animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
               transition={{ duration: 4, repeat: Infinity }}
               className="absolute -top-12 -right-12 w-20 h-20 bg-brand-primary/20 blur-2xl rounded-full"
            />
            <motion.div 
               animate={{ y: [0, 20, 0], opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
               transition={{ duration: 5, repeat: Infinity, delay: 1 }}
               className="absolute -bottom-12 -left-12 w-24 h-24 bg-brand-secondary/20 blur-2xl rounded-full"
            />
         </div>

         {/* Content Parameters */}
         <div className="space-y-6 max-w-xl">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-4"
            >
               <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
                  Nexus <span className="text-brand-secondary">Void</span>
               </h2>
               <p className="text-xl text-slate-400 font-bold italic leading-relaxed">
                  The requested endpoint ID does not exist within the current network architecture.
               </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="py-5 px-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 inline-block relative overflow-hidden group/quote"
            >
               <div className="absolute inset-0 bg-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <p className="text-xs font-black text-brand-secondary italic uppercase tracking-[0.2em] relative z-10">
                  "Looks like this payload went off-grid."
               </p>
            </motion.div>

            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] pt-4">
               Redirect to Operational Nodes or Initiate Support Relay.
            </p>
         </div>

         {/* Navigation Hub */}
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl px-6">
            <NavigationLink 
              icon={Home} 
              label="Primary Node" 
              sub="Return home" 
              onClick={() => navigate('/')} 
              accent="brand-primary" 
            />
            <NavigationLink 
              icon={Search} 
              label="Archives" 
              sub="Browse resources" 
              onClick={() => navigate('/resources')} 
              accent="blue-500" 
            />
            <NavigationLink 
              icon={MessageSquare} 
              label="Support" 
              sub="Initiate relay" 
              onClick={() => navigate('/contact')} 
              accent="brand-secondary" 
            />
         </div>
      </main>

      <div className="py-12 flex flex-col items-center gap-4 opacity-20">
         <div className="flex items-center gap-3">
            <Cpu size={14} className="text-white" />
            <span className="text-[9px] font-black uppercase tracking-[0.5em] italic">System Diagnostics v4.0.4</span>
         </div>
      </div>

      <Footer />
    </div>
  );
}

function NavigationLink({ icon: Icon, label, sub, onClick, accent }: any) {
  return (
    <button 
       onClick={onClick}
       className="group relative"
    >
       <div className={`absolute -inset-1 bg-${accent} border-${accent}/20 rounded-[2.5rem] blur-lg opacity-0 group-hover:opacity-20 transition-all duration-500`} />
       <GlassCard 
         intensity="low" 
         className="p-8 flex flex-col items-center gap-5 border-white/5 group-hover:border-white/20 transition-all relative z-10"
       >
          <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-inner group-hover:bg-white/10 group-hover:text-${accent}`}>
             <Icon size={28} className="text-slate-400 group-hover:text-inherit transition-colors" />
          </div>
          <div className="space-y-1">
             <span className="text-[10px] font-black uppercase tracking-widest text-white block">{label}</span>
             <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 italic group-hover:text-brand-primary transition-colors">{sub}</span>
          </div>
       </GlassCard>
    </button>
  );
}
