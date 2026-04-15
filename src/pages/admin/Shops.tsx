import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Store, 
  Calendar, 
  ShieldCheck, 
  ShieldAlert,
  Search,
  X,
  CreditCard,
  History,
  ExternalLink,
  Clock,
  Download, 
  AlertTriangle,
  Settings2,
  ArrowUpRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';
import { toast } from 'sonner';
import { formatIndianDateTime, isExpired, getFormattedRemainingTime, isExpiringSoon } from '../../utils/dateUtils';
import { useLanguage } from '../../context/LanguageContext';

interface Shop {
  id: string;
  shop_id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  shop_type: string;
  subscription?: {
    status: string;
    expiry_date: string;
    plan_id: number;
    plan?: { name: string }
    confirmed_at?: string;
    is_auto_mode: boolean;
    last_manual_override_at?: string;
  }
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_method: string;
  confirmed_at: string;
  plan: { name: string };
  utr_number: string;
}

export default function AdminShops() {
  const { language } = useLanguage();
  const [shops, setShops] = useState<Shop[]>([]);
  const [plans, setPlans] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [displayLimit, setDisplayLimit] = useState(20);
  
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [viewTab, setViewTab] = useState<'info' | 'history'>('info');
  const [shopPayments, setShopPayments] = useState<PaymentRecord[]>([]);
  const [subForm, setSubForm] = useState({
    status: 'active',
    plan_id: 1,
    expiry_date: '',
    expiry_time: '23:59',
    is_auto_mode: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchShopsAndPlans = async () => {
    try {
      const [shopsRes, subsRes, plansRes, historyRes] = await Promise.all([
        supabase.from('shops_profile').select('*'),
        supabase.from('subscriptions').select('*, plans(name)'),
        supabase.from('plans').select('id, name').order('id', { ascending: true }),
        supabase.from('payment_history').select('shop_id, confirmed_at').order('confirmed_at', { ascending: false })
      ]);
      
      if (shopsRes.error) throw shopsRes.error;
      
      const shopsData = (shopsRes.data || []).map(shop => {
        const sub = (subsRes.data || []).find(s => s.shop_id === shop.id);
        const lastConfirmation = (historyRes.data || []).find(h => h.shop_id === shop.id);
        
        return {
          ...shop,
          subscription: sub ? {
            status: sub.status,
            expiry_date: sub.expiry_date,
            plan_id: sub.plan_id,
            plan: sub.plans,
            confirmed_at: lastConfirmation?.confirmed_at,
            is_auto_mode: sub.is_auto_mode !== false,
            last_manual_override_at: sub.last_manual_override_at
          } : undefined
        };
      });

      setShops(shopsData as any[]);
      if (plansRes.data) setPlans(plansRes.data);
    } catch (err: any) {
      console.error('Fetch Error:', err);
      toast.error(`Sync Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopsAndPlans();

    const channel = supabase.channel('admin-shops-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => fetchShopsAndPlans())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops_profile' }, () => fetchShopsAndPlans())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payment_history' }, () => fetchShopsAndPlans())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const openShopDetail = async (shop: Shop) => {
    setSelectedShop(shop);
    setViewTab('info');
    setSubForm({
      status: shop.subscription?.status || 'active',
      plan_id: shop.subscription?.plan_id || plans[0]?.id || 1,
      expiry_date: shop.subscription?.expiry_date 
        ? new Date(shop.subscription.expiry_date).toISOString().split('T')[0]
        : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      expiry_time: shop.subscription?.expiry_date
        ? new Date(shop.subscription.expiry_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : '23:59',
      is_auto_mode: shop.subscription?.is_auto_mode !== false
    });

    const { data } = await supabase
      .from('payment_history')
      .select('*, plan:plans(name)')
      .eq('shop_id', shop.id)
      .order('confirmed_at', { ascending: false });
    
    if (data) setShopPayments(data as any[]);
  };

  const downloadReceipt = async (p: PaymentRecord, shop: Shop) => {
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const doc = new jsPDF();
      
      const brandGreen = [16, 185, 129];
      doc.setFontSize(22);
      doc.setTextColor(brandGreen[0], brandGreen[1], brandGreen[2]);
      doc.text('ORDER-DO', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Premium Network Authorization Receipt', 105, 28, { align: 'center' });

      doc.setDrawColor(241, 245, 249);
      doc.line(20, 35, 190, 35);

      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      
      // FIX: Handle long names with wrapping
      const shopNameWrapped = doc.splitTextToSize(`Entity: ${shop.shop_name}`, 160);
      doc.text(shopNameWrapped, 20, 50);
      
      const ownerNameWrapped = doc.splitTextToSize(`Authorized Personnel: ${shop.owner_name}`, 160);
      const ownerY = 50 + (shopNameWrapped.length * 7); // Calculate Y based on wrapped lines
      
      doc.setFont('helvetica', 'normal');
      doc.text(ownerNameWrapped, 20, ownerY);
      doc.text(`Nexus ID: ${shop.shop_id}`, 20, ownerY + 8);

      const tableData = [
        ['Protocol ID', p.id.slice(0, 8).toUpperCase()],
        ['Licensing Tier', p.plan?.name || 'Standard'],
        ['Allocation (INR)', `₹${p.amount}`],
        ['Transmission Route', p.payment_method],
        ['Validation Hash (UTR)', p.utr_number || 'Internal'],
        ['Commit Timestamp', formatIndianDateTime(p.confirmed_at, language)]
      ];

      (doc as any).autoTable({
        startY: 80,
        head: [['Attribute', 'Data Visualization']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: brandGreen, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 6 }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Order-Do Global Infrastructure License • Cloud Native Systems', 105, finalY + 20, { align: 'center' });
      doc.text('Cryptographically Verified Document', 105, finalY + 25, { align: 'center' });

      doc.save(`Receipt-${shop.shop_id}-${p.id.slice(0, 5)}.pdf`);
      toast.success('Licensing receipt finalized');
    } catch (err) {
      console.error('PDF Error:', err);
      toast.error('Receipt generation failed');
    }
  };

  const handleSaveSubscription = async () => {
    if (!selectedShop) return;
    setIsSaving(true);
    try {
      const combinedExpiry = new Date(`${subForm.expiry_date}T${subForm.expiry_time}:00`);
      
      const { error } = await supabase.from('subscriptions').upsert({
        shop_id: selectedShop.id,
        status: subForm.status,
        plan_id: subForm.plan_id,
        expiry_date: combinedExpiry.toISOString(),
        is_auto_mode: subForm.is_auto_mode,
        last_manual_override_at: !subForm.is_auto_mode ? new Date().toISOString() : null
      }, { onConflict: 'shop_id' });

      if (error) throw error;

      toast.success('Protocol configuration synchronized');
      setSelectedShop(null);
      fetchShopsAndPlans();
    } catch (err: any) {
      toast.error(`Sync failure: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredShops = shops.filter(s => 
    s.shop_name.toLowerCase().includes(search.toLowerCase()) || 
    s.shop_id.toLowerCase().includes(search.toLowerCase()) ||
    s.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  const paginatedShops = filteredShops.slice(0, displayLimit);
  const hasMore = filteredShops.length > displayLimit;

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <motion.h1 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none"
           >
             Nexus <span className="text-brand-primary">Directory</span>
           </motion.h1>
           <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 flex items-center gap-2">
             <Store size={12} className="text-brand-primary" />
             Active Entity Monitoring & Protocols
           </p>
        </div>
        <div className="flex items-center gap-4">
           <GlassCard intensity="low" className="flex items-center gap-3 px-6 h-14 border-white/20 dark:border-white/5">
              <Search className="text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search Nexus Hubs..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white w-48 placeholder:text-slate-500"
              />
              <Filter size={16} className="text-slate-300 ml-2" />
           </GlassCard>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
           {[1,2,3,4].map(i => (
             <GlassCard key={i} intensity="low" className="h-28 animate-pulse border-dashed border-white/10" />
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          <AnimatePresence mode="popLayout">
            {paginatedShops.map((shop, i) => {
              const expiring = isExpiringSoon(shop.subscription?.expiry_date || null);
              const expired = isExpired(shop.subscription?.expiry_date || null);
              
              return (
                <motion.div
                  key={shop.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <GlassCard 
                    intensity="low" 
                    className={`p-6 border-white/40 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between group hover:border-brand-primary/20 hover:shadow-glow-green/5 transition-all relative overflow-hidden h-full md:h-28`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-all border border-white/40 dark:border-white/5 shadow-inner">
                        <BarChart3 size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none group-hover:text-brand-primary transition-colors">{shop.shop_name}</h3>
                         <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{shop.shop_id}</span>
                            <div className="w-1 h-1 bg-brand-primary/20 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{shop.shop_type || 'Retail'} Hub</span>
                         </div>
                      </div>
                    </div>

                    <div className="mt-6 md:mt-0 flex items-center gap-10 lg:gap-16">
                       <div className="text-right hidden md:block">
                          <div className="flex items-center justify-end gap-3 mb-2">
                             {!shop.subscription?.is_auto_mode && (
                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                   Manual
                                </span>
                             )}
                             
                             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                expired ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                expiring ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' :
                                'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                             }`}>
                                {expired ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                {expired ? 'Restricted' : shop.subscription?.plan?.name || 'Standard'}
                             </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-end gap-2">
                               <Clock size={10} />
                               Lapse: {formatIndianDateTime(shop.subscription?.expiry_date || null, language)}
                            </p>
                            <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${expiring || expired ? 'text-amber-500' : 'text-slate-500 opacity-60'}`}>
                              {getFormattedRemainingTime(shop.subscription?.expiry_date || null, language)}
                            </p>
                          </div>
                       </div>

                       <Button 
                          onClick={() => openShopDetail(shop)}
                          variant="ghost"
                          className="h-14 px-8 bg-white/20 dark:bg-slate-900/20 !rounded-2xl border border-white/20 dark:border-white/5 hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                       >
                         Manage Nexus <ArrowUpRight size={14} className="ml-2" />
                       </Button>
                    </div>

                    {/* Background glow for status */}
                    <div className={`absolute top-0 right-0 w-32 h-full -z-10 blur-[60px] opacity-10 transition-colors ${
                      expired ? 'bg-red-500' : expiring ? 'bg-amber-500' : 'bg-brand-primary'
                    }`} />
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {hasMore && (
            <div className="flex justify-center pt-8">
              <Button 
                variant="ghost"
                onClick={() => setDisplayLimit(prev => prev + 20)}
                className="px-10 py-4 bg-white/20 dark:bg-slate-900/20 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                Load Next Batch <Download size={14} className="ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* SHOP DETAIL & MANAGE MODAL */}
      <AnimatePresence>
        {selectedShop && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl"
               onClick={() => !isSaving && setSelectedShop(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden"
            >
              <GlassCard intensity="high" className="border-white/20 dark:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="p-10 flex items-start justify-between border-b border-white/10 relative overflow-hidden">
                  <div className="relative z-10 flex items-center gap-5">
                     <div className="w-16 h-16 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-glow-green/10">
                        <Store size={32} />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter leading-none">{selectedShop.shop_name}</h2>
                        <div className="flex items-center gap-3 mt-3">
                           <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/10">{selectedShop.shop_id}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedShop.owner_name}</span>
                        </div>
                     </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedShop(null)} 
                    className="w-12 h-12 !p-0 !rounded-2xl bg-white/10 border border-white/10 text-slate-400 hover:text-white"
                  >
                     <X size={20} />
                  </Button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex px-10 pt-6">
                   <button 
                     onClick={() => setViewTab('info')} 
                     className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] border-b-4 transition-all flex items-center justify-center gap-2 ${viewTab === 'info' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                   >
                      <Settings2 size={12} /> Configuration
                   </button>
                   <button 
                     onClick={() => setViewTab('history')} 
                     className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] border-b-4 transition-all flex items-center justify-center gap-2 ${viewTab === 'history' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                   >
                      <History size={12} /> Archives
                   </button>
                </div>

                <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                   {viewTab === 'info' ? (
                      <div className="space-y-10">
                         <div className="grid grid-cols-2 gap-8 mt-2">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Licensing Protocol</label>
                               <select 
                                 value={subForm.plan_id}
                                 onChange={(e) => setSubForm({...subForm, plan_id: Number(e.target.value)})}
                                 className="w-full h-14 px-6 bg-white/30 dark:bg-slate-900/50 backdrop-blur-md border-2 border-white/20 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer"
                               >
                                 {plans.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name} Tier</option>)}
                               </select>
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nexus Status</label>
                               <select 
                                 value={subForm.status}
                                 onChange={(e) => setSubForm({...subForm, status: e.target.value})}
                                 className="w-full h-14 px-6 bg-white/30 dark:bg-slate-900/50 backdrop-blur-md border-2 border-white/20 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer"
                               >
                                 <option value="active" className="bg-slate-900">Synchronized (Live)</option>
                                 <option value="pending" className="bg-slate-900">Dormant (Waitlist)</option>
                                 <option value="expired" className="bg-slate-900">Throttled (Expired)</option>
                               </select>
                            </div>
                         </div>

                          {/* Manual Override Settings */}
                          <div className="bg-white/10 dark:bg-slate-900/40 p-10 rounded-[3rem] border border-white/10 space-y-8">
                             <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                   <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Autonomous Mode</h4>
                                      <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded-full text-[8px] font-black uppercase">Alpha</span>
                                   </div>
                                   <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Network driven duration logic</p>
                                </div>
                                <button 
                                  onClick={() => setSubForm({...subForm, is_auto_mode: !subForm.is_auto_mode})}
                                  className={`w-16 h-9 rounded-full transition-all flex items-center px-1.5 shadow-inner ${subForm.is_auto_mode ? 'bg-brand-primary shadow-glow-green/20' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                   <motion.div 
                                      animate={{ x: subForm.is_auto_mode ? 28 : 0 }}
                                      className="w-6 h-6 bg-white rounded-full shadow-2xl border-white"
                                   />
                                </button>
                             </div>

                             {!subForm.is_auto_mode && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="space-y-8"
                                >
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex items-start gap-4">
                                       <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-1" />
                                       <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase leading-relaxed tracking-widest">
                                          Manual Override Active — Synthetic duration logic bypassed. Central command must specify lapse coordinates.
                                       </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                       <div className="space-y-3">
                                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lapse Frame (Date)</label>
                                          <div className="relative">
                                             <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                             <input 
                                               type="date"
                                               value={subForm.expiry_date}
                                               onChange={(e) => setSubForm({...subForm, expiry_date: e.target.value})}
                                               className="w-full h-14 pl-14 pr-4 bg-white/20 dark:bg-slate-900/40 border border-white/10 rounded-2xl text-xs font-black outline-none focus:border-brand-primary transition-all text-white"
                                             />
                                          </div>
                                       </div>
                                       <div className="space-y-3">
                                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lapse Coordinate (Time)</label>
                                          <div className="relative">
                                             <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                             <input 
                                               type="time"
                                               value={subForm.expiry_time}
                                               onChange={(e) => setSubForm({...subForm, expiry_time: e.target.value})}
                                               className="w-full h-14 pl-14 pr-4 bg-white/20 dark:bg-slate-900/40 border border-white/10 rounded-2xl text-xs font-black outline-none focus:border-brand-primary transition-all text-white"
                                             />
                                          </div>
                                       </div>
                                    </div>
                                </motion.div>
                             )}
                          </div>

                          <div className="flex gap-4 pt-4">
                             <Button variant="ghost" className="flex-1 h-14 !rounded-2xl font-black uppercase tracking-widest text-slate-500" onClick={() => setSelectedShop(null)}>Abort Changes</Button>
                             <Button className="flex-2 h-14 !rounded-2xl shadow-glow-green" variant="primary" disabled={isSaving} onClick={handleSaveSubscription}>
                                {isSaving ? 'Synchronizing Protocols...' : 'Commit Configuration ✓'}
                             </Button>
                          </div>
                      </div>
                   ) : (
                      <div className="space-y-5">
                         {shopPayments.length === 0 ? (
                            <div className="py-20 text-center text-slate-500 space-y-6">
                               <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto opacity-20">
                                  <History size={40} />
                               </div>
                               <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">No archived transmissions found</p>
                            </div>
                         ) : (
                            shopPayments.map((p, i) => (
                               <motion.div 
                                 key={p.id}
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: i * 0.05 }}
                                 className="p-5 bg-white/20 dark:bg-slate-900/40 rounded-3xl border border-white/10 flex items-center justify-between group hover:border-brand-primary/20 transition-all"
                               >
                                  <div className="flex items-center gap-5">
                                     <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/10 shadow-glow-green/5">
                                        <CreditCard size={20} />
                                     </div>
                                     <div>
                                        <div className="flex items-center gap-2">
                                           <p className="text-sm font-black text-slate-800 dark:text-white uppercase italic">{p.plan?.name} Upgrade</p>
                                           <span className="text-[8px] font-black text-brand-primary px-1.5 py-0.5 bg-brand-primary/10 rounded uppercase">Success</span>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Via {p.payment_method} • Hash: {p.utr_number || 'N/A'}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-6">
                                     <div className="text-right">
                                        <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">₹{p.amount}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{new Date(p.confirmed_at).toLocaleDateString('en-IN')}</p>
                                     </div>
                                     <Button 
                                       variant="ghost"
                                       onClick={() => downloadReceipt(p, selectedShop)}
                                       className="w-12 h-12 !p-0 !rounded-xl bg-white/10 border border-white/10 text-slate-400 hover:text-brand-primary hover:border-brand-primary/20 transition-all"
                                       title="Finalize Receipt"
                                     >
                                        <Download size={18} />
                                     </Button>
                                  </div>
                               </motion.div>
                            ))
                         )}
                      </div>
                   )}
                </div>
                
                <div className="p-10 bg-brand-primary/5 dark:bg-brand-primary/5 flex items-center justify-between border-t border-white/10">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse shadow-glow-green" />
                      <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.4em]">Real-time Nexus Telemetry</span>
                   </div>
                   <button className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-[0.3em] hover:text-brand-primary transition-colors">
                      Extract System Log <ExternalLink size={12} />
                   </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
