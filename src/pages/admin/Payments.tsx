import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Clock,
  Check,
  Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import { toast } from 'sonner';

interface PendingPayment {
  id: string;
  shop_id: string;
  plan_id: number;
  amount: number;
  utr: string;
  status: string;
  created_at: string;
  shop: { shop_name: string; shop_id: string };
  plan: { name: string };
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    const { data } = await supabase.from('payments')
      .select('*, shop:shops_profile(shop_name, shop_id), plan:plans(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setPayments(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleAction = async (paymentId: string, action: 'confirmed' | 'rejected', shopId: string, planId: number) => {
    try {
      const { error } = await supabase.from('payments').update({ status: action }).eq('id', paymentId);
      
      if (action === 'confirmed') {
        // Activate Subscription
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1); // 1 Month by default

        await supabase.from('subscriptions').upsert({
          shop_id: shopId,
          plan_id: planId,
          status: 'active',
          expiry_date: expiry.toISOString()
        });
        toast.success('Payment confirmed and subscription activated!');
      } else {
        toast.error('Payment rejected');
      }
      fetchPayments();
    } catch (err) {
      toast.error('Transaction failed');
    }
  };

  return (
    <div className="space-y-8">
      <div>
         <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-widest uppercase italic">Payments Monitoring</h1>
         <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Verify UTR and Confirm Subscriptions</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
           {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/50 py-24 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400">
           <CreditCard size={48} className="mb-4 opacity-20" />
           <p className="font-bold uppercase tracking-widest text-xs">No pending payments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {payments.map((payment) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-3xl flex items-center justify-center">
                    <Clock size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white leading-none uppercase italic">{payment.shop.shop_name}</h3>
                    <p className="text-[10px] font-black text-kirana-green uppercase tracking-[0.2em] mt-1.5">{payment.plan.name} PLAN (₹{payment.amount})</p>
                    <div className="flex items-center gap-4 mt-3">
                       <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UTR:</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-white font-mono">{payment.utr}</span>
                          <button onClick={() => { navigator.clipboard.writeText(payment.utr); toast.info('UTR Copied'); }} className="text-slate-300 hover:text-slate-500"><Copy size={12} /></button>
                       </div>
                       <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{new Date(payment.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                   <button 
                     onClick={() => handleAction(payment.id, 'rejected', payment.shop_id, payment.plan_id)}
                     className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                   >
                     <Ban size={20} />
                   </button>
                   <button 
                     onClick={() => handleAction(payment.id, 'confirmed', payment.shop_id, payment.plan_id)}
                     className="px-8 py-4 bg-kirana-green text-white rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-kirana-green/20"
                   >
                     <Check size={20} /> Confirm Payment
                   </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
