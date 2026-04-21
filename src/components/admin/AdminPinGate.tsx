import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lock, ArrowRight, Settings2, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import GlassCard from '../ui/GlassCard';

export const AdminPinGate = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isAdminVerified, verifyAdminPin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Auto-focus on entry
  useEffect(() => {
    if (isAdmin && !isAdminVerified) {
      setPin('');
      setError(false);
    }
  }, [isAdmin, isAdminVerified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) return;

    setIsVerifying(true);
    setError(false);

    const success = await verifyAdminPin(pin);
    
    if (!success) {
      setError(true);
      setPin('');
      // Small delay for the error animation
      setTimeout(() => setError(false), 2000);
    }
    setIsVerifying(false);
  };

  if (!isAdmin) return null;
  if (isAdminVerified) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl overflow-hidden">
      {/* Immersive Background Nodes */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary/10 blur-[150px] rounded-full -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-brand-secondary/10 blur-[150px] rounded-full -ml-40 -mb-40 pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md p-6"
      >
        <GlassCard intensity="high" className="p-10 border-white/10 shadow-[0_0_100px_rgba(34,197,94,0.15)] relative overflow-hidden group">
          {/* Decorative Mesh */}
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Settings2 size={120} className="animate-spin-slow" />
          </div>

          <div className="text-center space-y-8 relative z-10">
            <div className="flex justify-center">
              <motion.div 
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center border-2 transition-all duration-500 shadow-2xl ${
                  error ? 'bg-red-500/20 border-red-500 text-red-500 shadow-red-500/20' : 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-glow-green/10'
                }`}
              >
                {error ? <ShieldAlert size={40} /> : <Lock size={40} className="animate-pulse" />}
              </motion.div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                Protocol <span className="text-brand-primary">LOCKED</span>
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] italic leading-relaxed">
                Terminal authorization required. Verify master clearance.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className={`w-full h-20 bg-white/5 border-2 rounded-[2rem] text-center text-3xl font-black tracking-[0.5em] text-white outline-none transition-all placeholder:text-slate-800 ${
                    error ? 'border-red-500/50 shadow-glow-red/5' : 'border-white/10 focus:border-brand-primary/50 focus:shadow-glow-green/10 shadow-inner'
                  }`}
                  autoFocus
                  disabled={isVerifying}
                />
                <AnimatePresence>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute -bottom-6 left-0 right-0 text-[9px] font-black text-red-500 uppercase tracking-widest italic"
                    >
                      AUTH_FAILURE: Checksum Mismatch
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col gap-4">
                <Button 
                  type="submit"
                  disabled={pin.length < 6 || isVerifying}
                  variant="primary"
                  className="w-full h-16 !rounded-2xl shadow-glow-green group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center justify-center gap-3 font-black uppercase italic tracking-[0.4em] text-xs">
                    {isVerifying ? 'Decrypting...' : 'Uplink ✓'} 
                    {!isVerifying && <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />}
                  </span>
                </Button>
                
                <div className="flex items-center justify-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                   <Fingerprint size={12} className="text-slate-400" />
                   <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Biometric Fallback Enabled</span>
                </div>
              </div>
            </form>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
