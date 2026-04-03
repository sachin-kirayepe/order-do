import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTalkingCharacter } from '../../context/TalkingCharacterContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminDashboard() {
  const { speak, setIsVisible } = useTalkingCharacter();
  const { language } = useLanguage();
  const [stats, setStats] = useState({
    totalShops: 0,
    activeSubs: 0,
    pendingPayments: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: shopsCount } = await supabase.from('shops_profile').select('*', { count: 'exact', head: true });
        const { count: subsCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const { count: paymentsCount } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        
        const { data: confirmedPayments } = await supabase.from('payments').select('amount').eq('status', 'confirmed');
        const totalRevenue = confirmedPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        const newStats = {
          totalShops: shopsCount || 0,
          activeSubs: subsCount || 0,
          pendingPayments: paymentsCount || 0,
          revenue: totalRevenue
        };
        setStats(newStats);

        // Admin Health Summary by Dhara
        setIsVisible(true);
        const reportText = language === 'hi' 
          ? `नमस्ते एडमिन! अभी हमारे नेटवर्क में ${newStats.totalShops} शॉप्स और ₹${newStats.revenue} रेवेन्यू है। शानदार काम!` 
          : `Namaste Admin! The network has ${newStats.totalShops} shops and ₹${newStats.revenue} in revenue. Great progress!`;
        
        speak(reportText, 'success');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [language, speak, setIsVisible]);

  const cardData = [
    { label: 'Total Shops', value: stats.totalShops, icon: <Users />, color: 'bg-blue-500' },
    { label: 'Active Subscriptions', value: stats.activeSubs, icon: <TrendingUp />, color: 'bg-kirana-green' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: <Clock />, color: 'bg-kirana-orange' },
    { label: 'Total Revenue', value: `₹${stats.revenue}`, icon: <CreditCard />, color: 'bg-indigo-500' },
  ];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-3xl" />)}
    </div>
  </div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-widest uppercase italic">Dashboard</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Overview of Order-Do Network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.color} opacity-[0.03] rounded-bl-full group-hover:opacity-[0.08] transition-opacity`} />
            
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${card.color} text-white shadow-lg shadow-${card.color.split('-')[1]}-500/20`}>
                {card.icon}
              </div>
              <ArrowUpRight size={16} className="text-slate-300" />
            </div>
            
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tabular-nums tracking-tighter italic">
                {card.value}
              </h2>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Placeholder for Recent Activity */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
               <AlertCircle size={16} className="text-kirana-green" /> Recent Activity
            </h3>
            <div className="space-y-6">
               <p className="text-slate-400 text-sm font-medium italic">Collecting live feed...</p>
            </div>
        </div>
      </div>
    </div>
  );
}
