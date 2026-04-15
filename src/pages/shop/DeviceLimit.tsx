import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, LogOut, Smartphone, Terminal, RefreshCcw, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getDeviceId } from '../../utils/deviceInfo';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';

export default function DeviceLimit() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const currentDeviceId = getDeviceId();

  const fetchSessions = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_active_at', { ascending: false });
    
    if (!error) setSessions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDeactivate = async (sessionId: string) => {
    setActionLoading(sessionId);
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (!error) {
      await fetchSessions();
      // If we deactivated another device, we might be able to reload now
      if (sessions.length <= 1) { // This is just a UI hint
         window.location.reload();
      }
    }
    setActionLoading(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-primary/30 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Aesthetic Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/10 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-secondary/10 blur-[120px] rounded-full -ml-40 -mb-40 pointer-events-none" />

      <main className="max-w-xl w-full relative z-10">
        <GlassCard intensity="high" className="p-10 border-red-500/20 shadow-[0_0_100px_rgba(239,68,68,0.1)]">
          <div className="text-center space-y-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-red-500/20 text-red-500 relative"
            >
               <ShieldAlert size={48} className="animate-pulse" />
               <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-red-500/10 rounded-[2.5rem] -z-10"
              />
            </motion.div>

            <div className="space-y-4">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-white">
                Multi-Device <span className="text-red-500">Locked</span>
              </h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs max-w-sm mx-auto leading-relaxed italic">
                Aapke plan ki login limit puri ho chuki hai. Naye device pe login karne ke liye kisi purane device se logout karein.
              </p>
            </div>

            {/* Active Sessions List */}
            <div className="space-y-4 text-left">
               <div className="flex items-center justify-between px-2">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2 italic">
                   <Smartphone size={12} /> Active Terminals
                 </h3>
                 <button onClick={fetchSessions} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <RefreshCcw size={14} />
                 </button>
               </div>

               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 <AnimatePresence mode="popLayout">
                   {sessions.map((session) => (
                     <motion.div
                       key={session.id}
                       layout
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       className={`p-5 rounded-2xl border flex items-center justify-between group transition-all ${
                         session.device_id === currentDeviceId 
                           ? 'bg-brand-primary/5 border-brand-primary/20' 
                           : 'bg-white/5 border-white/5 hover:border-white/10'
                       }`}
                     >
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            session.device_id === currentDeviceId ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/10 text-slate-400'
                          }`}>
                            <Terminal size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] font-black uppercase tracking-widest text-white italic">
                                {session.device_name}
                              </p>
                              {session.device_id === currentDeviceId && (
                                <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-[8px] font-black uppercase tracking-tighter rounded-full italic animate-pulse">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1 italic">
                              Last active: {new Date(session.last_active_at).toLocaleString()}
                            </p>
                          </div>
                       </div>

                       {session.device_id !== currentDeviceId && (
                         <Button
                           variant="ghost"
                           size="sm"
                           disabled={!!actionLoading}
                           onClick={() => handleDeactivate(session.id)}
                           className="!p-3 !rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all transform group-hover:scale-105"
                         >
                            {actionLoading === session.id ? (
                              <RefreshCcw size={14} className="animate-spin" />
                            ) : (
                              <LogOut size={14} />
                            )}
                         </Button>
                       )}
                     </motion.div>
                   ))}
                 </AnimatePresence>
               </div>
            </div>

            <div className="pt-6 grid grid-cols-2 gap-4">
               <Button 
                variant="ghost" 
                onClick={() => window.location.reload()}
                className="w-full h-14 !rounded-2xl border border-white/5 uppercase italic tracking-widest text-[10px] font-black"
               >
                 <RefreshCcw size={14} className="mr-2" /> Re-check
               </Button>
               <Button 
                variant="danger" 
                onClick={() => logout()}
                className="w-full h-14 !rounded-2xl shadow-glow-red/20 uppercase italic tracking-widest text-[10px] font-black"
               >
                 Sign Out <ArrowRight size={14} className="ml-2" />
               </Button>
            </div>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
