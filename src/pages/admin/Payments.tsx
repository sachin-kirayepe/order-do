import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  CreditCard, 
  Clock,
  Ban,
  ShieldCheck,
  X,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Fingerprint,
  IndianRupee,
  Users,
  Zap,
  RefreshCw,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GlassCard from '../../components/ui/GlassCard';
import { formatIndianDateTime } from '../../utils/dateUtils';

interface PendingPayment {
  id: string;
  shop_id: string;
  plan_id: number;
  amount: number;
  utr: string;
  duration_days: number;
  status: string;
  created_at: string;
  confirmed_at?: string;
  payment_proof_url?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_method?: string;
  gateway_fee?: number;
  net_amount?: number;
  shop: { shop_name: string; shop_id: string };
  plan: { 
    name: string; 
    duration_days: number; 
  };
}

interface RevenueMetrics {
  mrr: number;
  totalRazorpayRevenue: number;
  activeSubscribers: number;
  pendingManual: number;
}

export default function AdminPayments() {
  const { user: adminUser } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'razorpay' | 'history'>(
    (location.state as any)?.tab || 'pending'
  );
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    mrr: 0,
    totalRazorpayRevenue: 0,
    activeSubscribers: 0,
    pendingManual: 0,
  });

  const [confirmingPayment, setConfirmingPayment] = useState<PendingPayment | null>(null);
  const [confirmForm, setConfirmForm] = useState({
    amount: 0,
    method: 'UPI',
    utr: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBankVerified, setIsBankVerified] = useState(false);

  // Fetch Revenue Metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const [activeSubs, razorpayPaid, pendingPayments] = await Promise.all([
        supabase.from('subscriptions').select('id, plan:plans(monthly_price)', { count: 'exact' }).eq('status', 'active'),
        supabase.from('payments').select('amount, gateway_fee, net_amount').eq('status', 'razorpay_paid'),
        supabase.from('payments').select('id', { count: 'exact' }).eq('status', 'pending'),
      ]);

      const activeCount = activeSubs.count || 0;
      const mrrCalc = (activeSubs.data || []).reduce((sum: number, s: any) => sum + (s.plan?.monthly_price || 0), 0);
      const razorpayTotal = (razorpayPaid.data || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const pendingCount = pendingPayments.count || 0;

      setMetrics({
        mrr: mrrCalc,
        totalRazorpayRevenue: razorpayTotal,
        activeSubscribers: activeCount,
        pendingManual: pendingCount,
      });
    } catch (err) {
      console.error('Metrics fetch error:', err);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'history') {
        const { data: historyData, error } = await supabase
          .from('payment_history')
          .select(`
            *,
            shop:shops_profile(shop_name, shop_id),
            plan:plans(name, duration_days)
          `)
          .order('confirmed_at', { ascending: false });
        
        if (error) throw error;
        setPayments(historyData as any[]);
        return;
      }

      if (activeTab === 'razorpay') {
        const { data: razorpayData, error } = await supabase
          .from('payments')
          .select('*, shop:shops_profile(shop_name, shop_id), plan:plans(name, duration_days)')
          .eq('payment_method', 'razorpay')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPayments(razorpayData as any[]);
        return;
      }

      const [paymentsRes, manualPendingRes] = await Promise.all([
        supabase.from('payments').select('*, shop:shops_profile(shop_name, shop_id), plan:plans(name, duration_days)').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*, shop:shops_profile(shop_name, shop_id), plan:plans(name, duration_days)').eq('status', 'pending'),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;

      const mergedData: any[] = [];
      (paymentsRes.data || []).forEach(p => mergedData.push({ ...p, type: 'payment' }));

      (manualPendingRes.data || []).forEach(sub => {
        if (!mergedData.find(m => m.shop_id === sub.shop_id)) {
          mergedData.push({ 
            id: `manual-${sub.id}`, 
            shop_id: sub.shop_id, 
            plan_id: sub.plan_id, 
            amount: 0, 
            utr: 'N/A', 
            status: 'pending', 
            created_at: sub.created_at, 
            type: 'manual', 
            shop: sub.shop, 
            plan: sub.plan 
          });
        }
      });
      setPayments(mergedData.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err: any) {
      console.error('Payments Fetch Error:', err);
      toast.error(`Sync Failure: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPayments();
    fetchMetrics();

    const channel = supabase.channel('admin-payments-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => { fetchPayments(); fetchMetrics(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_history' }, () => { fetchPayments(); fetchMetrics(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => { fetchPayments(); fetchMetrics(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPayments, fetchMetrics]);

  const openConfirmModal = (payment: PendingPayment) => {
    setConfirmingPayment(payment);
    setConfirmForm({
      amount: payment.amount || 0,
      method: 'UPI',
      utr: payment.utr || ''
    });
    setIsBankVerified(false);
  };

  const processConfirmation = async () => {
    if (!confirmingPayment || !adminUser) return;
    setIsProcessing(true);
    
    try {
      const daysToAdd = confirmingPayment.duration_days || 30;
      
      // NEW: Atomic Protocol Execution
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('confirm_payment_protocol', {
        p_shop_id: confirmingPayment.shop_id,
        p_admin_id: adminUser.id,
        p_payment_id: confirmingPayment.id.startsWith('manual-') ? null : confirmingPayment.id,
        p_amount: confirmForm.amount,
        p_method: confirmForm.method,
        p_utr: confirmForm.utr,
        p_days_to_add: daysToAdd,
        p_plan_id: confirmingPayment.plan_id,
        p_is_manual: confirmingPayment.id.startsWith('manual-')
      });

      if (rpcErr) throw rpcErr;
      if (!(rpcRes as any).success) throw new Error((rpcRes as any).error);

      toast.success(`Protocol Confirmed. Expiry: ${formatIndianDateTime((rpcRes as any).new_expiry, language)}`);

      setConfirmingPayment(null);
      fetchPayments();
    } catch (err: any) {
      console.error('Confirmation Error:', err);
      toast.error(`Authorization rejected: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!confirm('EXTERMINATE: Rejection will purge this transmission request. Continue?')) return;
    try {
      if (!paymentId.startsWith('manual-')) {
        await supabase.from('payments').update({ status: 'rejected' }).eq('id', paymentId);
      }
      toast.error('Transmission purged');
      fetchPayments();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'razorpay_paid': return { label: 'AUTO-PAID', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <Zap size={14} /> };
      case 'razorpay_created': return { label: 'INITIATED', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <Activity size={14} /> };
      case 'razorpay_failed': return { label: 'FAILED', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <Ban size={14} /> };
      case 'refunded': return { label: 'REFUNDED', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <RefreshCw size={14} /> };
      case 'confirmed': return { label: 'CONFIRMED', color: 'text-brand-primary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20', icon: <ShieldCheck size={14} /> };
      case 'pending': return { label: 'PENDING', color: 'text-brand-secondary', bg: 'bg-brand-secondary/10', border: 'border-brand-secondary/20', icon: <Clock size={14} /> };
      default: return { label: status.toUpperCase(), color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: <Clock size={14} /> };
    }
  };

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <motion.h1 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none"
           >
             Financial <span className="text-brand-primary">Nexus</span>
           </motion.h1>
           <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 flex items-center gap-2">
             <TrendingUp size={12} className="text-brand-primary" />
             Revenue Intelligence & Transaction Streams
           </p>
        </div>

        <div className="flex p-1.5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl shadow-inner w-fit">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-brand-primary text-white shadow-glow-green font-black' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            Pending {metrics.pendingManual > 0 && <span className="ml-1 px-2 py-0.5 bg-red-500 text-white rounded-full text-[8px]">{metrics.pendingManual}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('razorpay')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'razorpay' ? 'bg-brand-primary text-white shadow-glow-green font-black' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            Razorpay
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-brand-primary text-white shadow-glow-green font-black' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            Confirmed
          </button>
        </div>
      </div>

      {/* Revenue Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard intensity="low" className="p-6 border-white/10 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <IndianRupee size={18} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">MRR</p>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">₹{metrics.mrr.toLocaleString('en-IN')}</p>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2 italic">Monthly Recurring Revenue</p>
          <div className="absolute top-0 right-0 w-20 h-full bg-brand-primary/5 blur-[40px] -z-10" />
        </GlassCard>

        <GlassCard intensity="low" className="p-6 border-white/10 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap size={18} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Razorpay</p>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">₹{metrics.totalRazorpayRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2 italic">Auto-Collected Revenue</p>
          <div className="absolute top-0 right-0 w-20 h-full bg-emerald-500/5 blur-[40px] -z-10" />
        </GlassCard>

        <GlassCard intensity="low" className="p-6 border-white/10 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users size={18} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Active</p>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">{metrics.activeSubscribers}</p>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2 italic">Active Subscribers</p>
          <div className="absolute top-0 right-0 w-20 h-full bg-blue-500/5 blur-[40px] -z-10" />
        </GlassCard>

        <GlassCard intensity="low" className="p-6 border-white/10 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock size={18} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Pending</p>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">{metrics.pendingManual}</p>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2 italic">Manual Verifications</p>
          <div className="absolute top-0 right-0 w-20 h-full bg-amber-500/5 blur-[40px] -z-10" />
        </GlassCard>
      </div>

      {loading ? (
        <div className="space-y-4">
           {[1,2,3].map(i => <GlassCard key={i} intensity="low" className="h-28 animate-pulse border-white/10" />)}
        </div>
      ) : payments.length === 0 ? (
        <GlassCard intensity="low" className="py-24 border-dashed border-2 border-white/20 text-center space-y-6">
           <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto opacity-20">
              <CreditCard size={40} className="text-slate-400" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">No transaction streams detected</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          <AnimatePresence mode="popLayout">
            {payments.map((payment: PendingPayment, i) => (
              <motion.div
                key={payment.id}
                layout
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <GlassCard
                  intensity="low"
                  className="p-6 border-white/40 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between group hover:border-brand-primary/20 transition-all relative overflow-hidden"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all border shadow-inner ${payment.status === 'confirmed' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20'}`}>
                      {payment.status === 'confirmed' ? <ShieldCheck size={28} /> : <Clock size={28} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none group-hover:text-brand-primary transition-colors">{payment.shop?.shop_name}</h3>
                      <div className="flex items-center gap-3 mt-3">
                          <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{payment.plan?.name} Tier</span>
                          <div className="w-1 h-1 bg-brand-primary/20 rounded-full" />
                          <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">{payment.duration_days || 30} Days</span>
                          <div className="w-1 h-1 bg-brand-primary/20 rounded-full" />
                          <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase italic tracking-tighter text-lg">₹{payment.amount}</span>
                       </div>
                    </div>
                  </div>

                  <div className="mt-6 md:mt-0 flex items-center gap-10 lg:gap-16">
                     {/* Status Badge */}
                     {activeTab === 'razorpay' && (() => {
                       const sc = getStatusConfig(payment.status);
                       return (
                         <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl ${sc.bg} border ${sc.border}`}>
                           <span className={sc.color}>{sc.icon}</span>
                           <span className={`text-[9px] font-black uppercase tracking-widest ${sc.color}`}>{sc.label}</span>
                         </div>
                       );
                     })()}

                     <div className="text-right hidden lg:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-end gap-2">
                           <Fingerprint size={10} /> {payment.razorpay_payment_id ? 'Razorpay ID' : 'Transmission Hash'}
                        </p>
                        <p className="text-xs font-mono font-black text-slate-800 dark:text-slate-200 tracking-tighter">{payment.razorpay_payment_id || payment.utr || (payment as any).payment_method || 'ANONYMOUS'}</p>
                     </div>
                     
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-end gap-2 text-right">
                          <Calendar size={10} /> {payment.status === 'pending' ? 'Initiated' : 'Finalized'}
                        </p>
                        <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                          {formatIndianDateTime(payment.confirmed_at || payment.created_at, language)}
                        </p>
                     </div>

                     {activeTab === 'pending' && (
                       <div className="flex gap-3">
                          <Button 
                            variant="ghost" 
                            onClick={() => handleReject(payment.id)} 
                            className="w-12 h-12 !p-0 !rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/10"
                          >
                             <Ban size={18} />
                          </Button>
                          <Button 
                            onClick={() => openConfirmModal(payment)} 
                            className="h-14 px-8 !rounded-2xl shadow-glow-green" 
                            variant="primary"
                          >
                             Authorize <ArrowUpRight size={16} className="ml-2" />
                          </Button>
                       </div>
                     )}
                     
                     {activeTab === 'history' && (
                        <div className="w-12 h-12 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary/30 rotate-12">
                           <Receipt size={24} />
                        </div>
                     )}
                  </div>

                  {/* Aesthetic Background Gradient */}
                  <div className={`absolute top-0 right-0 w-32 h-full -z-10 blur-[80px] opacity-10 transition-colors ${
                    payment.status === 'confirmed' ? 'bg-brand-primary' : 'bg-brand-secondary'
                  }`} />
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
         {confirmingPayment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl"
                 onClick={() => !isProcessing && setConfirmingPayment(null)}>
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md overflow-hidden"
               >
                  <GlassCard intensity="high" className="border-white/20 dark:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                     <div className="p-10 text-center border-b border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-5 blur-[40px] rounded-full" />
                        <Button 
                          variant="ghost" 
                          onClick={() => setConfirmingPayment(null)} 
                          className="absolute top-6 right-6 w-10 h-10 !p-0 !rounded-xl text-white/40 hover:text-white"
                        >
                           <X size={18} />
                        </Button>
                        <div className="w-20 h-20 bg-brand-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-brand-primary/20 shadow-glow-green/10">
                           <CreditCard className="text-brand-primary" size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Authorize Stream</h2>
                        <div className="flex items-center justify-center gap-2 mt-3">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination Hub:</span>
                           <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{confirmingPayment.shop?.shop_name}</span>
                        </div>
                     </div>

                     <div className="p-10 space-y-8">
                         <div className="grid grid-cols-2 gap-6">
                           <Input 
                             label="Validated Amount (₹)" 
                             type="number" 
                             value={confirmForm.amount} 
                             onChange={(e) => setConfirmForm({...confirmForm, amount: Number(e.target.value)})}
                           />
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Route</label>
                              <select 
                                value={confirmForm.method}
                                onChange={(e) => setConfirmForm({...confirmForm, method: e.target.value})}
                                className="w-full h-14 px-5 bg-white/30 dark:bg-slate-900/50 border-2 border-white/20 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer"
                              >
                                 <option value="UPI" className="bg-slate-900">UPI Digital</option>
                                 <option value="Cash" className="bg-slate-900">Physical Cash</option>
                                 <option value="Bank" className="bg-slate-900">Swift/Bank</option>
                              </select>
                           </div>
                         </div>

                         <Input 
                           label="Protocol Verification (UTR/Hash)" 
                           value={confirmForm.utr} 
                           onChange={(e) => setConfirmForm({...confirmForm, utr: e.target.value})}
                           placeholder="Enter Validation Hash"
                         />
                         
                         <div className="space-y-4">
                             <div 
                               onClick={() => setIsBankVerified(!isBankVerified)}
                               className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${isBankVerified ? 'bg-brand-primary/10 border-brand-primary' : 'bg-red-500/5 border-red-500/20 animate-pulse'}`}
                             >
                                <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isBankVerified ? 'bg-brand-primary border-brand-primary' : 'border-slate-400'}`}>
                                   {isBankVerified && <ShieldCheck size={14} className="text-white" />}
                                </div>
                                <div>
                                   <p className={`text-[10px] font-black uppercase tracking-widest ${isBankVerified ? 'text-brand-primary' : 'text-red-500'}`}>
                                      I have verified ₹{confirmForm.amount} in Bank Statement
                                   </p>
                                   <p className="text-[9px] font-bold text-slate-500 leading-tight mt-1">
                                      Confirming without checking bank statement can lead to financial loss.
                                   </p>
                                </div>
                             </div>

                             <div className="bg-brand-secondary/5 border border-brand-secondary/20 p-6 rounded-[2rem] flex items-start gap-4">
                                <Sparkles className="text-brand-secondary shrink-0 mt-1" size={20} />
                                 <p className="text-[10px] font-black text-brand-secondary uppercase leading-relaxed tracking-widest">
                                   Verification will initialize a **{confirmingPayment.duration_days || 30} Day Cycle** extension on the target nexus.
                                 </p>
                             </div>
                          </div>

                          <div className="flex gap-4 pt-4">
                             <Button variant="ghost" className="flex-1 h-14 !rounded-2xl font-black uppercase tracking-widest text-slate-500" onClick={() => setConfirmingPayment(null)}>Abort</Button>
                             <Button 
                               className="flex-2 h-14 !rounded-2xl shadow-glow-green" 
                               variant="primary" 
                               disabled={isProcessing || !isBankVerified} 
                               onClick={processConfirmation}
                             >
                                {isProcessing ? 'Verifying Cipher...' : 'Authorize Activation ✓'}
                             </Button>
                          </div>
                     </div>
                  </GlassCard>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
