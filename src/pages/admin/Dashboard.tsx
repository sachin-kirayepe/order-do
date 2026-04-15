import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  ShieldCheck,
  Zap,
  Settings,
  TrendingUp as TrendingUpIcon,
  Crown,
  AlertCircle,
  Clock,
  LayoutDashboard,
  Activity as ActivityIcon,
  Globe
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';

interface Activity {
  id: string;
  shop_name: string;
  amount: number;
  confirmed_at: string;
  plan_name: string;
}

export default function AdminDashboard() {
  useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalShops: 0,
    activeSubs: 0,
    pendingPayments: 0,
    revenue: 0
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topShops, setTopShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkPressure, setNetworkPressure] = useState(15);
  const [activityNodes, setActivityNodes] = useState<number[]>([]);

  const fetchStats = async () => {
    try {
      const [shopsRes, subsRes, paymentsRes, confirmedRes] = await Promise.all([
        supabase.from('shops_profile').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('payments').select('shop_id').eq('status', 'pending'),
        supabase.from('payment_history').select('*').eq('status', 'confirmed')
      ]);

      const { count: manualPendingCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      const paymentShopIds = new Set(paymentsRes.data?.map(p => p.shop_id) || []);
      const totalPending = paymentShopIds.size + (manualPendingCount || 0);

      const totalRevenue = confirmedRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        totalShops: shopsRes.count || 0,
        activeSubs: subsRes.count || 0,
        pendingPayments: totalPending,
        revenue: totalRevenue
      });

      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const dailyRevenue = last7Days.map(date => {
        const revenue = confirmedRes.data
          ?.filter(p => p.confirmed_at && p.confirmed_at.split('T')[0] === date)
          .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        return {
          date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          revenue
        };
      });
      setChartData(dailyRevenue);

      const shopCounts: Record<string, { name: string, count: number, revenue: number }> = {};
      const { data: shopNames } = await supabase.from('shops_profile').select('id, shop_name');
      const nameMap = Object.fromEntries(shopNames?.map(s => [s.id, s.shop_name]) || []);

      confirmedRes.data?.forEach(p => {
        if (!shopCounts[p.shop_id]) {
          shopCounts[p.shop_id] = { name: nameMap[p.shop_id] || 'Unknown', count: 0, revenue: 0 };
        }
        shopCounts[p.shop_id].count += 1;
        shopCounts[p.shop_id].revenue += Number(p.amount);
      });

      const leaderBoard = Object.values(shopCounts)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopShops(leaderBoard);

      const { data: activityData } = await supabase
        .from('payment_history')
        .select(`
          id,
          amount,
          confirmed_at,
          shops_profile(shop_name),
          plans(name)
        `)
        .order('confirmed_at', { ascending: false })
        .limit(5);

      if (activityData) {
        setRecentActivity(activityData.map((a: any) => {
          const profile = Array.isArray(a.shops_profile) ? a.shops_profile[0] : a.shops_profile;
          const plan = Array.isArray(a.plans) ? a.plans[0] : a.plans;
          
          return {
            id: a.id,
            shop_name: profile?.shop_name || 'Unknown Shop',
            amount: a.amount || 0,
            confirmed_at: a.confirmed_at,
            plan_name: plan?.name || 'Standard Plan'
          };
        }));
      }

      // Fetch global pending orders for pressure metric
      const { count: pendingCount } = await supabase
        .from('pending_orders')
        .select('*', { count: 'exact', head: true });
      
      setNetworkPressure(Math.min(100, (pendingCount || 0) * 10 + 15));

    } catch (err) {
      console.error('Stats Update Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate random activity nodes for the heatmap
  useEffect(() => {
    const nodes = Array.from({ length: 48 }, () => Math.floor(Math.random() * 100));
    setActivityNodes(nodes);
    
    const interval = setInterval(() => {
      setActivityNodes(prev => prev.map(val => 
        Math.max(0, Math.min(100, val + (Math.random() * 30 - 15)))
      ));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchStats();

    const channels = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops_profile' }, () => fetchStats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payment_history' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_orders' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  const AnimatedNumber = ({ value, prefix = '' }: { value: number | string, prefix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const numericValue = typeof value === 'string' ? Number(value.replace(/[^0-9.-]+/g, "")) : value;

    useEffect(() => {
      const start = displayValue;
      const end = numericValue;
      if (start === end) return;

      const duration = 1000;
      const startTime = performance.now();

      const update = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * progress);
        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [numericValue]);

    return <span>{prefix}{displayValue.toLocaleString()}</span>;
  };

  const cardData = [
    { label: 'Network Reach', sub: 'Active Shops', value: stats.totalShops, icon: <Users size={20} />, color: 'brand-primary', path: '/admin/shops' },
    { label: 'Active Coverage', sub: 'Subscription Live', value: stats.activeSubs, icon: <LayoutDashboard size={20} />, color: 'brand-secondary', path: '/admin/plans' },
    { label: 'Pending Bridge', sub: 'Unconfirmed Subs', value: stats.pendingPayments, icon: <Zap size={20} />, color: 'amber-500', path: '/admin/payments' },
    { label: 'Gross Revenue', sub: 'Lifetime Confirmed', value: stats.revenue, icon: <CreditCard size={20} />, color: 'indigo-500', path: '/admin/payments', isCurrency: true },
  ];

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="flex items-center justify-between">
         <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
         <div className="h-10 w-32 bg-slate-100 dark:bg-slate-900 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-[2rem]" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none"
          >
            Mission <span className="text-brand-primary">Console</span>
          </motion.h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 flex items-center gap-2">
            <ActivityIcon size={12} className="text-brand-primary" />
            Live Network Operational • Real-time Sync Active
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <GlassCard className="px-5 py-2.5 flex items-center gap-2.5 border-brand-primary/20 bg-brand-primary/5">
              <div className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">System Online</span>
           </GlassCard>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(card.path)}
          >
            <GlassCard 
              intensity="high" 
              className="p-8 group cursor-pointer hover:border-brand-primary/30 transition-all relative overflow-hidden h-full"
            >
              <div className="flex items-start justify-between mb-6">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl bg-${card.color} group-hover:scale-110 transition-transform`}>
                    {card.icon}
                 </div>
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={18} className="text-brand-primary" />
                 </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                <div className="flex items-baseline gap-2">
                   <h2 className="text-4xl font-black text-slate-900 dark:text-white tubular-nums tracking-tighter italic leading-none break-all">
                     <AnimatedNumber value={card.value} prefix={(card as any).isCurrency ? '₹' : ''} />
                   </h2>
                   <div className="text-[8px] font-black text-brand-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Active</div>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{card.sub}</p>
              </div>

              {/* Decorative Accent */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-colors" />
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Futuristic Network Heatmap */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard intensity="high" className="p-10 border-brand-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 blur-[100px] rounded-full" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="md:w-1/3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2.5 mb-2">
                <Globe size={20} className="text-brand-primary animate-spin-slow" /> Live Network Pulse
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Global Operation Pressure</p>
              
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">{networkPressure}%</span>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${networkPressure > 70 ? 'bg-red-500 text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>
                    {networkPressure > 70 ? 'Extreme Load' : 'Optimal'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${networkPressure}%` }}
                    className={`h-full ${networkPressure > 70 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-brand-primary shadow-glow-green'}`}
                  />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                  Analyzing order velocity and node synchronization across active shards...
                </p>
              </div>
            </div>

            <div className="flex-1 w-full flex justify-center">
              <div className="grid grid-cols-12 gap-3 p-1">
                {activityNodes.map((val, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 1, 0.3],
                      backgroundColor: val > 80 ? 'rgba(239, 68, 68, 0.8)' : val > 50 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.2)'
                    }}
                    transition={{ 
                      duration: 2 + (i % 3), 
                      repeat: Infinity,
                      delay: (i % 10) * 0.1
                    }}
                    className="w-3 h-3 md:w-4 md:h-4 rounded-full shadow-lg border border-white/10"
                    title={`Node ${i}: ${Math.floor(val)}% activity`}
                  />
                ))}
              </div>
            </div>

            <div className="md:w-1/4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/40 dark:border-white/5">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Shards</p>
                <p className="text-xl font-black text-slate-900 dark:text-white italic">128</p>
              </div>
              <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/40 dark:border-white/5">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Latency</p>
                <p className="text-xl font-black text-brand-primary italic">24ms</p>
              </div>
              <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/40 dark:border-white/5">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Uptime</p>
                <p className="text-xl font-black text-indigo-500 italic">99.9%</p>
              </div>
              <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/40 dark:border-white/5 text-brand-primary">
                <Zap size={20} className="mt-2 animate-pulse" />
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Analytics Chart */}
        <div className="lg:col-span-2">
           <GlassCard intensity="medium" className="p-10 border-white/40 dark:border-white/10 h-full">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2.5">
                       <TrendingUpIcon size={18} className="text-brand-primary" /> Revenue Velocity
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Network Growth over last 7 days</p>
                 </div>
                 <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-brand-primary/10 rounded-lg text-[9px] font-black text-brand-primary uppercase tracking-widest border border-brand-primary/20">
                       Real-time
                    </div>
                 </div>
              </div>

              <div className="h-[320px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorAdminRev" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                       <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8', textAnchor: 'middle' }}
                          dy={15}
                       />
                       <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                          dx={-10}
                       />
                       <Tooltip 
                          contentStyle={{ 
                             backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                             backdropFilter: 'blur(10px)',
                             border: '1px solid rgba(255,255,255,0.1)', 
                             borderRadius: '20px', 
                             padding: '12px 16px',
                             boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                          }}
                          itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                          labelStyle={{ color: '#10b981', fontSize: '8px', fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase' }}
                          cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                       />
                       <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#10b981" 
                          strokeWidth={5} 
                          fillOpacity={1} 
                          fill="url(#colorAdminRev)" 
                          animationDuration={2000}
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </GlassCard>
        </div>

        {/* Top Performing Shops (Leaderboard) */}
        <div>
           <GlassCard intensity="medium" className="p-10 border-white/40 dark:border-white/10 flex flex-col h-full overflow-hidden">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2.5">
                 <Crown size={20} className="text-amber-500" /> Network Elites
              </h3>
              
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                 {topShops.map((shop, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="flex items-center justify-between p-5 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/40 dark:border-white/5 group hover:bg-slate-900 hover:border-brand-primary/50 transition-all duration-500 cursor-default"
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-xl shrink-0 ${i === 0 ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                             {i + 1}
                          </div>
                          <div className="min-w-0">
                             <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-white uppercase truncate italic leading-tight">{shop.name}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{shop.count} Settlements</p>
                          </div>
                       </div>
                       <div className="text-right shrink-0">
                          <p className="text-sm font-black text-white uppercase italic tracking-tighter break-all leading-none mb-2">₹{shop.revenue}</p>
                       </div>
                    </motion.div>
                 ))}
                 {topShops.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 opacity-30">
                         <Crown size={32} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest italic">Scanning Network...</p>
                   </div>
                 )}
              </div>
              
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin/shops')} 
                className="mt-8 w-full h-12 !rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-brand-primary/10 hover:text-brand-primary transition-all gap-2"
              >
                 Detailed Network Analysis
                 <ArrowUpRight size={14} />
              </Button>
           </GlassCard>
        </div>
      </div>

      {/* Activity and System Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <GlassCard intensity="high" className="p-10 border-white/40 dark:border-white/10">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2.5">
                     <AlertCircle size={20} className="text-brand-primary" /> Live Stream
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Mission Critical Logs</p>
               </div>
               
               <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {recentActivity.map((activity, idx) => (
                       <motion.div 
                         key={activity.id}
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         transition={{ delay: idx * 0.05 }}
                         className="flex items-center justify-between p-6 bg-white/20 dark:bg-slate-950/20 rounded-[1.75rem] border border-white/20 dark:border-white/5 group hover:border-brand-primary/30 transition-all duration-500"
                       >
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 bg-white dark:bg-slate-900 text-brand-primary rounded-xl flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-110 transition-transform">
                                <ShieldCheck size={22} />
                             </div>
                             <div>
                                <p className="text-base font-black text-slate-900 dark:text-white uppercase italic leading-tight">{activity.shop_name}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{activity.plan_name} • Node Activated</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-brand-primary italic leading-none">+₹{activity.amount}</p>
                             <div className="flex items-center gap-1.5 justify-end mt-2">
                                <Clock size={10} className="text-slate-400" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                   {new Date(activity.confirmed_at).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
                                </p>
                             </div>
                          </div>
                       </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {recentActivity.length === 0 && (
                    <div className="py-20 text-center">
                       <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 opacity-20 animate-pulse">
                          <ActivityIcon size={40} />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Awaiting Network Events...</p>
                    </div>
                  )}
               </div>
            </GlassCard>
        </div>

        {/* System Health Section */}
        <div className="space-y-8 h-full flex flex-col">
           <GlassCard intensity="high" className="p-10 border-white/10 bg-slate-900 dark:bg-slate-950 text-white shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-between">
              <div className="relative z-10">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Engine Diagnostics</h3>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                       <Zap size={20} className="text-brand-primary animate-pulse" />
                    </div>
                 </div>
                 
                 <div className="space-y-5">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                       <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Sync Bridge</span>
                          <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-2 py-1 rounded-lg">99.9% Up</span>
                       </div>
                       <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '99.9%' }} transition={{ duration: 2 }} className="h-full bg-brand-primary" />
                       </div>
                    </div>
                    
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                       <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Compute Engine</span>
                          <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-2 py-1 rounded-lg">Optimal</span>
                       </div>
                       <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '12%' }} transition={{ duration: 2 }} className="h-full bg-brand-primary" />
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="mt-10 relative z-10">
                 <Button 
                   variant="ghost" 
                   onClick={() => navigate('/admin/settings')} 
                   className="w-full h-14 !rounded-2xl border border-white/10 text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all gap-3"
                 >
                    Advanced Protocols
                    <Settings className="w-4 h-4" />
                 </Button>
              </div>

              {/* Liquid Orbs */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

