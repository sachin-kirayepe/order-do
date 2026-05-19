import { motion } from 'framer-motion';
import { Zap, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionBannerProps {
  status: 'active' | 'expired' | 'expiring' | 'free';
  planName: string;
  daysRemaining?: number;
}

export default function SubscriptionBanner({ status, planName, daysRemaining }: SubscriptionBannerProps) {
  const config = {
    active: {
      bg: 'bg-brand-primary/10',
      border: 'border-brand-primary/20',
      text: 'text-brand-primary',
      icon: <CheckCircle2 size={16} />,
      label: 'SYSTEM ONLINE',
    },
    expiring: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-500',
      icon: <Clock size={16} />,
      label: 'RELAY EXPIRING',
    },
    expired: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-500',
      icon: <AlertTriangle size={16} />,
      label: 'NODE OFFLINE',
    },
    free: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
      text: 'text-slate-400',
      icon: <Zap size={16} />,
      label: 'GUEST ACCESS',
    }
  };

  const current = config[status];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full p-4 rounded-2xl border ${current.border} ${current.bg} flex items-center justify-between gap-4 backdrop-blur-xl mb-8`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl ${current.bg} border ${current.border} flex items-center justify-center ${current.text}`}>
          {current.icon}
        </div>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${current.text} italic`}>{current.label}</p>
          <h4 className="text-sm font-bold text-white uppercase italic tracking-wider">
            {planName} Plan {daysRemaining !== undefined && <span className="text-slate-500 ml-2">({daysRemaining} Days)</span>}
          </h4>
        </div>
      </div>

      <Link 
        to="/plans" 
        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic border ${status === 'free' ? 'bg-brand-primary border-brand-primary text-white shadow-glow-green' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
      >
        {status === 'free' ? 'UPGRADE NODE' : 'EXTEND PROTOCOL'}
      </Link>
    </motion.div>
  );
}
