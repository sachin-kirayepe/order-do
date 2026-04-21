import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, CheckCircle, XCircle, Clock, ExternalLink, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import { toast } from 'sonner';

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = async () => {
    const { data } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setDisputes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (id: string, status: 'resolved' | 'dismissed') => {
    const { error } = await supabase
      .from('disputes')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to update dispute');
    } else {
      toast.success(`Dispute ${status === 'resolved' ? 'resolved' : 'dismissed'}`);
      fetchDisputes();
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Conflict Zone...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
            Conflict <span className="text-red-500">Zone</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <ShieldAlert size={12} className="text-red-500" />
            Active Payment Disputes & Fraud Reports
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {disputes.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <GlassCard intensity="high" className={`p-8 border-2 ${d.status === 'pending' ? 'border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-800'}`}>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.status === 'pending' ? 'bg-red-500/10 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                          <ShieldAlert size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID: {d.order_id}</p>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">{d.customer_name || 'Anonymous'}</h3>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        d.status === 'pending' ? 'bg-red-500 text-white animate-pulse' : 
                        d.status === 'resolved' ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'
                      }`}>
                        {d.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Clock size={10} /> Created At
                        </p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {new Date(d.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <IndianRupee size={10} /> Amount/UTR
                        </p>
                        <p className="text-xs font-mono font-bold text-brand-primary uppercase">
                          {d.payment_utr || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Customer Complaint</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        "{d.reason}"
                      </p>
                    </div>
                  </div>

                  <div className="md:w-64 flex flex-col gap-3 justify-center">
                    {d.status === 'pending' && (
                      <>
                        <Button 
                          onClick={() => handleResolve(d.id, 'resolved')} 
                          variant="primary" 
                          className="w-full h-12 !rounded-xl text-xs uppercase font-black bg-green-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Mark Resolved
                        </Button>
                        <Button 
                          onClick={() => handleResolve(d.id, 'dismissed')} 
                          variant="ghost" 
                          className="w-full h-12 !rounded-xl text-xs uppercase font-black text-slate-500 border border-slate-300"
                        >
                          <XCircle size={16} className="mr-2" />
                          Dismiss Case
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" className="w-full h-12 !rounded-xl text-[10px] uppercase font-black gap-2 opacity-50 cursor-not-allowed">
                       View Shop Evidence
                       <ExternalLink size={12} />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {disputes.length === 0 && (
          <div className="py-32 text-center bg-slate-100 dark:bg-slate-900/40 rounded-[3.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <ShieldAlert size={64} className="mx-auto mb-6 text-slate-300 opacity-20" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest italic">All Quiet in the Conflict Zone</h3>
            <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">No active disputes reported</p>
          </div>
        )}
      </div>
    </div>
  );
}
