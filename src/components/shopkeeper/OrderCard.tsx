import { Clock, User, PackageOpen, Volume2, Banknote, QrCode, CheckCircle2, Shield, Zap } from 'lucide-react';
import type { PendingOrder } from '../../db/dexie';
import { useVoice } from '../../context/VoiceContext';
import { useLanguage } from '../../context/LanguageContext';
import SecureCanvas from '../ui/SecureCanvas';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import { motion } from 'framer-motion';
import { useSubscription } from '../../context/SubscriptionContext';

interface OrderCardProps {
  order: PendingOrder;
  onClick: () => void;
  shopName?: string;
}

export default function OrderCard({ order, onClick, shopName }: OrderCardProps) {
  const { t } = useLanguage();
  const { announceOrder } = useVoice();
  const { hasFeature } = useSubscription();
  
  // Decryption is now handled in the parent Dashboard for performance/async reasons
  const displayName = (order as any).decryptedName || 'Customer';
  const isPurged = displayName === 'DELETED_FOR_PRIVACY' || displayName.includes('AUTO_PURGED');
  
  const timeAgo = getTimeAgo(order.createdAt);
  const expiryInfo = getExpiryInfo(order.createdAt);

  // Elite Gating: Speedometer Logic (> 15 mins = SLOW)
  const orderAgeMs = Date.now() - order.createdAt;
  const speedometerEnabled = hasFeature('order_speedometer');
  const isSlow = speedometerEnabled && orderAgeMs > 15 * 60 * 1000; 

  const handleAnnounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    announceOrder(displayName, order.items, order.short_id || 'NEW', order.type, order.no);
  };

  return (
    <GlassCard
      onClick={onClick}
      intensity="medium"
      className={`relative group overflow-hidden border-white/20 dark:border-white/5 transition-all duration-500 ${
        order.status === 'ready' ? 'ring-2 ring-brand-primary/40' : ''
      } ${
        isSlow && order.status !== 'ready' ? 'ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : ''
      }`}
    >
      {/* Slow Alert Pulsing Background */}
      {isSlow && order.status !== 'ready' && (
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-red-500 pointer-events-none"
        />
      )}

      <div className="flex gap-4 p-5 relative z-10">
        {/* Customer photo thumbnail with liquid glow */}
        <div className="relative w-16 h-16 shrink-0">
          <div className={`absolute inset-0 rounded-2xl blur-lg group-hover:blur-xl transition-all ${isSlow ? 'bg-red-500/20' : 'bg-brand-primary/20'}`} />
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 shadow-2xl">
            {order.photoDataUrl ? (
              <SecureCanvas 
                image={order.photoDataUrl} 
                width={100} 
                height={100} 
                className="w-full h-full border-none object-cover"
                tagline="Secure"
                shopName={shopName}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <User size={24} />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
                <SecureCanvas 
                  content={isPurged ? 'DATA_EXPIRED' : displayName} 
                  width={180} 
                  height={24} 
                  fontSize={14} 
                  className="border-none bg-transparent font-black uppercase tracking-tight" 
                  shopName={shopName}
                />
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                   <span className="text-[8px] font-black text-slate-400">ID:</span>
                   <span className="text-[9px] font-mono font-black text-brand-primary">{order.short_id || order.id.slice(-4).toUpperCase()}</span>
                </div>
                <Shield size={12} className={isPurged ? "text-slate-300 shrink-0" : "text-brand-primary shrink-0"} />
            </div>
            
            {order.status === 'ready' ? (
              <span className="text-[9px] font-black uppercase tracking-widest text-white bg-brand-primary px-3 py-1 rounded-full shadow-glow-green animate-pulse">
                Ready
              </span>
            ) : isSlow ? (
              <span className="text-[9px] font-black uppercase tracking-widest text-white bg-red-500 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)] flex items-center gap-1 animate-pulse">
                <Zap size={10} className="fill-white" />
                Slow
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
                New
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                <PackageOpen size={12} className="text-brand-secondary" /> {order.items.length} Items
              </span>
              <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${isSlow ? 'bg-red-500/10 text-red-500' : 'opacity-60 italic'}`}>
                <Clock size={12} className={isSlow ? 'animate-spin-slow' : ''} /> {timeAgo}
              </span>
            </div>

            {/* Payment Badge */}
            {order.paymentStatus && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                order.paymentReceived 
                  ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' 
                  : order.paymentStatus === 'upi' 
                    ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                    : 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20'
              }`}>
                {order.paymentReceived ? <CheckCircle2 size={10} /> : order.paymentStatus === 'upi' ? <QrCode size={10} /> : <Banknote size={10} />}
                {order.paymentReceived ? t('customer.paymentReceived') : order.paymentStatus === 'upi' ? 'UPI' : 'COD'}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-3 font-medium truncate flex items-center gap-1">
             <span className="opacity-50">#</span>
             {order.items.map((i) => `${i.quantity} ${i.name}`).join(', ')}
          </p>
        </div>

        {/* Announce button */}
        <div className="flex flex-col justify-center items-center gap-2">
          <Button
            variant="ghost"
            className="w-12 h-12 rounded-2xl !p-0 bg-brand-secondary/5 hover:bg-brand-secondary/20 text-brand-secondary"
            onClick={handleAnnounce}
          >
            <Volume2 size={20} />
          </Button>
          {!isPurged && (
            <span className={`text-[8px] font-black uppercase tracking-widest ${expiryInfo.isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
               {expiryInfo.text}
            </span>
          )}
        </div>
      </div>
      
      {/* Magnetic Bottom Accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r ${isSlow ? 'from-red-500 to-red-600' : 'from-brand-primary to-brand-secondary'}`} />
    </GlassCard>
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

const PURGE_THRESHOLD = 4 * 60 * 60 * 1000;

function getExpiryInfo(timestamp: number) {
  const elapsed = Date.now() - timestamp;
  const remaining = PURGE_THRESHOLD - elapsed;
  if (remaining <= 0) return { text: 'Deleting...', isUrgent: true };
  const minutes = Math.floor(remaining / 60000);
  if (minutes < 60) return { text: `${minutes}m left`, isUrgent: true };
  const hours = Math.floor(minutes / 60);
  return { text: `${hours}h left`, isUrgent: false };
}

function getTimeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return 'Abhi';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
