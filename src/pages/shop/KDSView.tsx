import { useEffect, useState, useCallback, useRef } from 'react';
import db from '../../db/dexie';
import type { ShopProfile, PendingOrder } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, User, CheckCircle2, 
  ArrowLeft, Tv, Volume2, VolumeX, Fullscreen,
  LayoutList, Zap,
  Cpu, Thermometer, ShieldCheck, Fingerprint
} from 'lucide-react';
import { decrypt } from '../../utils/encryption';
import { useLanguage } from '../../context/LanguageContext';
import { useAntiCapture } from '../../hooks/useAntiCapture';
import ProtectionOverlay from '../../components/ui/ProtectionOverlay';
import SecureCanvas from '../../components/ui/SecureCanvas';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useVoice } from '../../context/VoiceContext';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';

export default function KDSView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { speak } = useVoice();
  
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { isBlocked } = useAntiCapture(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  
  const lastCountRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const load = async () => {
      const profiles = await db.shopProfile.toArray();
      const p = profiles.find(x => x.id === user?.id) || profiles[profiles.length - 1];
      if (!p) {
        navigate('/shop/setup');
      } else {
        setProfile(p);
      }
      setLoading(false);
    };
    load();
  }, [user, navigate]);

  const playChime = useCallback(() => {
    if (isMuted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // TC-081: Handle Browser Autoplay Blocks
      if (ctx.state === 'suspended') {
        setIsAudioBlocked(true);
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error('Audio error:', e);
    }
  }, [isMuted]);

  const resumeAudio = async () => {
    if (audioContextRef.current) {
      await audioContextRef.current.resume();
      setIsAudioBlocked(false);
      playChime();
      toast.success(language === 'hi' ? 'आवाज़ सक्रिय हो गई!' : 'Sound activated!');
    } else {
      // Initialize if not already
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      await audioContextRef.current.resume();
      setIsAudioBlocked(false);
      playChime();
    }
  };

  const refresh = useCallback(async () => {
    if (!profile) return;
    const p = await db.pendingOrders
      .where('shopId')
      .equals(profile.shopId)
      .reverse()
      .sortBy('createdAt');
    
    const active = p.filter(o => o.status === 'pending' || o.status === 'accepted');
    
    if (active.length > lastCountRef.current && lastCountRef.current > 0) {
      playChime();
      const newest = active[0];
      if (newest && !isMuted) {
        const customerName = await decrypt(newest.customerName);
        const orderAlertText = language === 'hi' 
          ? `नया ऑर्डर आया है! ${customerName} का।` 
          : `New payload from ${customerName}!`;
        speak(orderAlertText);
        toast(orderAlertText, { icon: <Zap size={18} className="text-brand-primary" /> });
      }
    }
    
    lastCountRef.current = active.length;
    setOrders(active);
  }, [profile, playChime, language, isMuted, speak]);

  useEffect(() => {
    if (!profile) return;
    
    let isMounted = true;
    let timerId: NodeJS.Timeout;

    const poll = async () => {
      await refresh();
      if (isMounted) {
        timerId = setTimeout(poll, 3000); // Recursive timeout is safer than interval
      }
    };

    poll();
    const timeInterval = setInterval(() => setCurrentTime(Date.now()), 60000);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      clearInterval(timeInterval);
    };
  }, [profile, refresh]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleMarkReady = async (orderId: string) => {
    await db.pendingOrders.update(orderId, { status: 'ready' });
    if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
    toast.success(t('kds.orderReady'), { icon: <CheckCircle2 size={18} className="text-brand-primary" /> });
    refresh();
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
       <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-brand-primary/30 relative overflow-hidden">
      <ProtectionOverlay isVisible={isBlocked} />
      
      {/* Background Aesthetic Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-secondary/5 blur-[120px] rounded-full -ml-40 -mb-40 pointer-events-none" />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="h-20 flex items-center justify-between px-8 bg-slate-900/40 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/shop/dashboard')}
            className="w-12 h-12 !p-0 !rounded-xl bg-white/5 text-slate-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </Button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-brand-primary tracking-[0.4em] mb-1 leading-none italic">Omni-Channel Nexus</span>
            <div className="h-7 flex items-center">
               <SecureCanvas 
                content={profile?.shopName || 'KITCHEN'} 
                width={300} 
                height={28} 
                fontSize={20} 
                className="border-none bg-transparent" 
                tagline="Force Locked"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-6 mr-6 opacity-40">
             <div className="flex items-center gap-2">
                <Cpu size={14} className="text-brand-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest">Core Sync</span>
             </div>
             <div className="flex items-center gap-2">
                <Thermometer size={14} className="text-brand-secondary" />
                <span className="text-[9px] font-black uppercase tracking-widest">Thermal Stable</span>
             </div>
          </div>

          <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
             <Button 
              variant="ghost" 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className={`w-12 h-12 !p-0 !rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-primary text-white shadow-glow-green' : 'text-slate-400'}`}
            >
              <LayoutList size={20} />
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setIsMuted(!isMuted)}
              className={`w-12 h-12 !p-0 !rounded-xl transition-all ${isMuted ? 'bg-red-500/10 text-red-500' : 'text-slate-400'}`}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
            <AnimatePresence>
              {isAudioBlocked && (
                <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  onClick={resumeAudio}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20 animate-pulse"
                >
                  <Volume2 size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Enable Sound</span>
                </motion.button>
              )}
            </AnimatePresence>

            <Button 
              variant="ghost" 
              onClick={handleToggleFullscreen}
              className="w-12 h-12 !p-0 !rounded-xl text-slate-400"
            >
              <Fullscreen size={20} />
            </Button>
            <Button 
               variant="ghost"
               onClick={() => {
                 if (confirm('Exit KDS and Logout?')) {
                   supabase.auth.signOut().then(() => navigate('/shop/login'));
                 }
               }}
               className="w-12 h-12 !p-0 !rounded-xl text-red-400 hover:bg-red-500/10"
               title="Emergency Reset/Logout"
            >
               <Fingerprint size={20} />
            </Button>
          </div>

          <div className="h-10 w-px bg-white/5 mx-2" />
          
          <GlassCard intensity="low" className="flex items-center gap-3 px-6 h-14 border-brand-primary/20">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-primary shadow-glow-green animate-pulse" />
            <span className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] italic">{orders.length} Active Payloads</span>
          </GlassCard>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {orders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[calc(100vh-16rem)] flex flex-col items-center justify-center text-slate-500 text-center"
            >
              <div className="w-32 h-32 rounded-[3rem] bg-white/5 flex items-center justify-center mb-8 border border-white/5 shadow-inner">
                <Tv size={56} className="opacity-10 text-brand-primary" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{t('kds.noOrders')}</h2>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">Waiting for network transmission...</p>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8"
                : "flex flex-col gap-6 max-w-6xl mx-auto"
              }
            >
              {orders.map((order) => (
                <KDSCard 
                  key={order.id} 
                  order={order} 
                  onReady={() => handleMarkReady(order.id)} 
                  viewMode={viewMode}
                  currentTime={currentTime}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer Telemetry ──────────────────────────────────────────────── */}
      <footer className="h-14 bg-slate-900/60 backdrop-blur-3xl border-t border-white/5 px-8 flex items-center justify-between">
        <div className="flex gap-10">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-brand-primary shadow-glow-green" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Live Transmission</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-brand-secondary shadow-glow-secondary animate-pulse" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Urgent (+10m)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 opacity-30 group hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-2">
              <ShieldCheck size={12} className="text-brand-primary" />
              <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
           </div>
           <div className="flex items-center gap-2">
              <Fingerprint size={12} className="text-slate-400" />
              <span className="text-[9px] font-black uppercase tracking-widest">Secure Node: {profile?.shopId?.slice(0, 8)}</span>
           </div>
        </div>
      </footer>
    </div>
  );
}

function KDSCard({ order, onReady, viewMode, currentTime }: { order: PendingOrder; onReady: () => void; viewMode: 'grid' | 'list'; currentTime: number }) {
  const { t } = useLanguage();
  const [customerName, setCustomerName] = useState('Decrypting...');

  useEffect(() => {
    decrypt(order.customerName).then(setCustomerName);
  }, [order.customerName]);
  
  const minutesAgo = Math.floor((currentTime - order.createdAt) / 60000);
  const isUrgent = minutesAgo >= 10;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
    >
      <GlassCard 
        intensity={isUrgent ? "high" : "low"} 
        className={`border-2 transition-all duration-500 flex flex-col overflow-hidden relative group h-full ${
          isUrgent ? 'border-brand-secondary animate-pulse-slow shadow-glow-secondary/10' : 'border-white/10 hover:border-brand-primary/20'
        } ${viewMode === 'list' ? 'flex-row items-center !h-28' : ''}`}
      >
        {/* Visual Header / Media */}
        <div className={`shrink-0 overflow-hidden relative shadow-inner ${viewMode === 'list' ? 'w-28 h-full border-r border-white/10' : 'h-48 border-b border-white/10'}`}>
          {order.photoDataUrl ? (
            <SecureCanvas 
              image={order.photoDataUrl} 
              width={400} 
              height={300} 
              className="w-full h-full border-none object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              tagline="Confidential"
            />
          ) : (
            <div className="w-full h-full bg-slate-950 flex items-center justify-center text-white/5">
              <User size={viewMode === 'list' ? 32 : 64} />
            </div>
          )}
          
          {/* Badge: Destination / Type */}
          {(order.type && order.no) && (
            <div className="absolute top-4 left-4 flex items-center h-10 px-4 bg-slate-950/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
               <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mr-3">
                  {order.type === 'table' ? t('kds.table') : t('kds.counter')}
               </span>
               <span className="text-xl font-black text-brand-primary leading-none italic">{order.no}</span>
            </div>
          )}

          {/* Payment Status Overlay */}
          {order.paymentStatus && (
            <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-2xl ${
              order.paymentReceived 
                ? 'bg-brand-primary border-brand-primary text-slate-950 font-black' 
                : order.paymentStatus === 'upi' 
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-brand-secondary border-brand-secondary text-white'
            }`}>
              {order.paymentReceived ? 'Settled ✓' : `Unpaid: ${order.paymentStatus.toUpperCase()}`}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col p-6 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0 flex-1">
               <div className="h-8 flex items-center opacity-80 group-hover:opacity-100 transition-opacity">
                  <SecureCanvas content={customerName} width={300} height={32} fontSize={18} className="border-none bg-transparent" />
               </div>
               <div className="flex items-center gap-2 mt-2">
                  <Clock size={12} className={isUrgent ? 'text-brand-secondary' : 'text-slate-500'} />
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isUrgent ? 'text-brand-secondary' : 'text-slate-500'}`}>
                    {minutesAgo}m Persistence
                  </span>
               </div>
            </div>
            {viewMode === 'grid' && (
              <Button 
                onClick={onReady}
                variant="primary"
                className="w-14 h-14 !p-0 !rounded-[1.5rem] shadow-glow-green shrink-0 ml-4 group/btn"
              >
                <CheckCircle2 size={28} className="group-hover/btn:scale-110 transition-transform" />
              </Button>
            )}
          </div>

          <div className="flex-1 space-y-3 mt-2 overflow-y-auto custom-scrollbar pr-1">
             <div className="h-px bg-white/10 w-full opacity-50" />
             <div className="lg:opacity-80 group-hover:opacity-100 transition-opacity">
                <SecureCanvas 
                  content={order.items.map(it => `${it.quantity}x ${it.name}`)} 
                  width={500} 
                  height={Math.max(40, order.items.length * 30)} 
                  fontSize={15}
                  className="border-none bg-transparent"
                  tagline="Payload Details"
                />
             </div>
          </div>
        </div>

        {viewMode === 'list' && (
          <div className="px-8 shrink-0">
            <Button 
              onClick={onReady}
              variant="primary"
              className="h-14 px-8 !rounded-2xl shadow-glow-green font-black uppercase italic tracking-widest text-xs"
            >
              <CheckCircle2 size={18} className="mr-3" />
              Initialize Ready
            </Button>
          </div>
        )}

        {/* Dynamic Background intensity */}
        <div className={`absolute top-0 right-0 w-32 h-full -z-10 blur-[60px] opacity-10 transition-colors ${
          isUrgent ? 'bg-brand-secondary' : 'bg-brand-primary'
        }`} />
      </GlassCard>
    </motion.div>
  );
}
