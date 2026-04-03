import { useEffect, useState, useCallback, useRef } from 'react';
import db from '../../db/dexie';
import type { ShopProfile, PendingOrder } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, User, CheckCircle2, 
  ArrowLeft, Tv, Volume2, VolumeX, Fullscreen,
  LayoutGrid, LayoutList
} from 'lucide-react';
import { decrypt } from '../../utils/encryption';
import { useLanguage } from '../../context/LanguageContext';
import { useAntiCapture } from '../../hooks/useAntiCapture';
import ProtectionOverlay from '../../components/ui/ProtectionOverlay';
import SecureCanvas from '../../components/ui/SecureCanvas';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { announceOrder, announceText } from '../../utils/announce';

export default function KDSView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { isBlocked } = useAntiCapture(true);
  
  const lastCountRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load profile
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

  // Audio beep helper
  const playChime = useCallback(() => {
    if (isMuted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
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

  // Poll for orders
  const refresh = useCallback(async () => {
    if (!profile) return;
    const p = await db.pendingOrders
      .where('shopId')
      .equals(profile.shopId)
      .reverse()
      .sortBy('createdAt');
    
    // Filter out already 'rejected' if we only want pending/accepted/ready
    // Actually, we want to show pending and accepted. Ready should disappear from KDS usually,
    // but the shopkeeper needs to see it in Dashboard.
    const active = p.filter(o => o.status === 'pending' || o.status === 'accepted');
    
    if (active.length > lastCountRef.current && lastCountRef.current > 0) {
      playChime();
      const newest = active[0];
      if (newest && !isMuted) {
        announceText(t('dashboard.newOrderArrived') || 'Naya order aaya!');
        setTimeout(() => announceOrder(decrypt(newest.customerName), newest.items, newest.type, newest.no), 1500);
      }
      toast.info(t('dashboard.newOrderArrived'));
    }
    
    lastCountRef.current = active.length;
    setOrders(active);
  }, [profile, playChime, t]);

  useEffect(() => {
    if (!profile) return;
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
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
    toast.success(t('kds.orderReady'));
    refresh();
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-kirana-green/30 relative">
      <ProtectionOverlay isVisible={isBlocked} />
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/shop/dashboard')}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-kirana-green to-emerald-400 bg-clip-text text-transparent uppercase tracking-tighter italic">
              {t('kds.title').replace('[shopName]', profile?.shopName || 'KITCHEN')}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400"
          >
            {viewMode === 'grid' ? <LayoutList size={20} /> : <LayoutGrid size={20} />}
          </button>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl transition-all ${isMuted ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-slate-400'}`}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button 
            onClick={handleToggleFullscreen}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400"
          >
            <Fullscreen size={20} />
          </button>
          <div className="h-10 w-px bg-white/5 mx-1" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-kirana-green/10 border border-kirana-green/20 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-kirana-green animate-pulse" />
            <span className="text-xs font-bold text-kirana-green uppercase tracking-widest">{orders.length} ACTIVE</span>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {orders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-slate-500 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Tv size={48} className="opacity-20" />
              </div>
              <p className="text-2xl font-bold tracking-tight">{t('kds.noOrders')}</p>
              <p className="mt-2 text-slate-600">New orders will appear here in real-time.</p>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-4 max-w-4xl mx-auto"
              }
            >
              {orders.map((order) => (
                <KDSCard 
                  key={order.id} 
                  order={order} 
                  onReady={() => handleMarkReady(order.id)} 
                  viewMode={viewMode}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="h-12 border-t border-white/5 bg-slate-900/80 px-6 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-kirana-green" /> NEW</span>
          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-kirana-orange" /> OLDER (+10M)</span>
        </div>
        <div className="flex items-center gap-2 opacity-50">
          <Tv size={12} />
          <span>REAL-TIME ENGINE ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}

function KDSCard({ order, onReady, viewMode }: { order: PendingOrder; onReady: () => void; viewMode: 'grid' | 'list' }) {
  const { t } = useLanguage();
  const customerName = decrypt(order.customerName);
  const minutesAgo = Math.floor((Date.now() - order.createdAt) / 60000);
  const isUrgent = minutesAgo >= 10;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-slate-900 border-2 rounded-2xl overflow-hidden flex flex-col transition-colors shadow-2xl ${
        isUrgent ? 'border-kirana-orange/30' : 'border-white/5'
      } ${viewMode === 'list' ? 'flex-row items-center h-24' : ''}`}
    >
      {/* Photo Column / Row */}
      <div className={`shrink-0 relative bg-slate-900 ${viewMode === 'list' ? 'w-24 h-24' : 'h-40'}`}>
        {order.photoDataUrl ? (
          <SecureCanvas 
            image={order.photoDataUrl} 
            width={400} 
            height={300} 
            className="w-full h-full border-none"
            tagline="KDS Secure"
          />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-700">
            <User size={48} />
          </div>
        )}
        
        {/* Table Badge */}
        {order.type && order.no && (
          <div className="absolute top-2 left-2 px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400">
               {order.type === 'table' ? t('kds.table') : t('kds.counter')}
            </span>
            <span className="text-lg font-black text-kirana-green">{order.no}</span>
          </div>
        )}

        {/* Payment Status */}
        {order.paymentStatus && (
          <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter italic border ${
            order.paymentReceived 
              ? 'bg-kirana-green border-kirana-green text-white shadow-lg shadow-kirana-green/20' 
              : order.paymentStatus === 'upi' 
                ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
          }`}>
            {order.paymentReceived ? 'PAID' : order.paymentStatus.toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <SecureCanvas content={customerName} width={300} height={32} fontSize={18} className="border-none bg-transparent" />
            <div className="flex items-center gap-2 mt-1 px-1">
              <Clock size={14} className={isUrgent ? 'text-kirana-orange' : 'text-slate-500'} />
              <span className={`text-xs font-bold ${isUrgent ? 'text-kirana-orange font-black animate-pulse' : 'text-slate-500'}`}>
                {minutesAgo} MIN AGO
              </span>
            </div>
          </div>
          {viewMode === 'grid' && (
            <button 
              onClick={onReady}
              className="p-3 bg-kirana-green text-slate-950 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-kirana-green/20"
            >
              <CheckCircle2 size={24} />
            </button>
          )}
        </div>

        {viewMode === 'grid' && (
          <div className="flex-1 space-y-2 mt-2 px-1">
            <div className="h-px bg-white/5 w-full mb-3" />
            <SecureCanvas 
              content={order.items.map(it => `${it.quantity}x ${it.name}`)} 
              width={350} 
              height={Math.max(100, order.items.length * 28)} 
              fontSize={14}
              className="border-none bg-transparent"
            />
          </div>
        )}

        {viewMode === 'list' && (
           <div className="flex-1 flex items-center gap-6 px-4">
              <SecureCanvas 
                content={order.items.map(it => `${it.quantity}x ${it.name}`)} 
                width={500} 
                height={40} 
                fontSize={13}
                className="border-none bg-transparent"
              />
           </div>
        )}
      </div>

      {viewMode === 'list' && (
        <div className="px-6">
          <button 
            onClick={onReady}
            className="flex items-center gap-3 px-6 py-3 bg-kirana-green text-slate-950 rounded-2xl font-black uppercase text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-kirana-green/20"
          >
            <CheckCircle2 size={18} />
            {t('kds.orderReady')}
          </button>
        </div>
      )}
    </motion.div>
  );
}
