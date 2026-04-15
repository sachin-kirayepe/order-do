import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, LogOut, Terminal, RefreshCcw, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getDeviceId } from '../../utils/deviceInfo';
import { toast } from 'sonner';

export default function SessionManager() {
  const { user } = useAuth();
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
    
    if (error) {
      toast.error('Session terminate karne mein error aaya');
    } else {
      toast.success('Session successfully terminated');
      await fetchSessions();
    }
    setActionLoading(null);
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-4">
        <RefreshCcw size={24} className="animate-spin text-brand-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing Sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
          <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Security Protocol</h3>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Device Terminals</p>
        </div>
        <button 
          onClick={fetchSessions} 
          disabled={loading}
          className={`p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCcw size={14} className="text-slate-400" />
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                session.device_id === currentDeviceId 
                  ? 'bg-brand-primary/5 border-brand-primary/20 shadow-glow-green/5' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  session.device_id === currentDeviceId ? 'bg-brand-primary/10 text-brand-primary' : 'bg-white/10 text-slate-400'
                }`}>
                  <Terminal size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-white italic">
                      {session.device_name}
                    </p>
                    {session.device_id === currentDeviceId && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded-full border border-brand-primary/20">
                        <div className="w-1 h-1 rounded-full bg-brand-primary animate-pulse" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Active</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter italic">
                      Linked: {new Date(session.created_at).toLocaleDateString()}
                    </p>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter italic">
                      Pulse: {new Date(session.last_active_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {session.device_id !== currentDeviceId && (
                <button
                  disabled={!!actionLoading}
                  onClick={() => handleDeactivate(session.id)}
                  className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/10"
                >
                  {actionLoading === session.id ? (
                    <RefreshCcw size={14} className="animate-spin" />
                  ) : (
                    <LogOut size={14} />
                  )}
                </button>
              )}
              
              {session.device_id === currentDeviceId && (
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/10 opacity-40">
                   <ShieldCheck size={16} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {sessions.length === 0 && !loading && (
          <div className="py-10 text-center opacity-40">
             <Smartphone size={32} className="mx-auto mb-3" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">No registered terminals</p>
          </div>
        )}
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-relaxed">
           <span className="text-brand-primary">Security Tip:</span> Agar aap koi aisa device dekh rahe hain jo aapka nahi hai, toh usey turant deactivate karein aur apna password badlein.
         </p>
      </div>
    </div>
  );
}
