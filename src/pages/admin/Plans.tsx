import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Settings2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GlassCard from '../../components/ui/GlassCard';
import { toast } from 'sonner';

interface Plan {
  id: number;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  features: Record<string, any>;
  is_active: boolean;
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({
    name: '',
    description: '',
    monthly_price: 0,
    yearly_price: 0,
    features: {
      qr_limit_unlimited: false, kds: false, reports: false, upi: false,
      analytics: false, menu_management: false, voice_assistant: false,
      whatsapp_alerts: false, inventory_management: false, thermal_printing: false,
      customer_database: false, priority_support: false, regional_languages: false,
      custom_branding: false, staff_accounts: false, multi_terminal: false,
      smart_inventory: false, magic_feedback: false, order_speedometer: false,
      max_devices: 1
    },
    is_active: true
  });

  const fetchPlans = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setFetchError(null);
      const { data, error } = await supabase.from('plans').select('*').order('id', { ascending: true });
      if (error) throw error;
      if (data) setPlans(data);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      if (!silent) setFetchError(err.message || 'Failed to load plans');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans(false);

    const channel = supabase.channel('admin-plans-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => {
        console.log('[AdminPlans] Real-time Update detected');
        fetchPlans(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSave = async () => {
    try {
      const savePayload: any = {
        name: currentPlan.name || 'Unnamed Plan',
        features: currentPlan.features || {},
      };
      if (currentPlan.description) savePayload.description = currentPlan.description;
      if (currentPlan.monthly_price !== undefined) savePayload.monthly_price = currentPlan.monthly_price;
      if (currentPlan.yearly_price !== undefined) savePayload.yearly_price = currentPlan.yearly_price;

      if (currentPlan.id) {
        const updatedPlan = { ...currentPlan, ...savePayload } as Plan;
        setPlans(prev => prev.map(p => p.id === currentPlan.id ? updatedPlan : p));
        setIsEditing(false);
        toast.success('Licensing protocol updated');

        const { error } = await supabase.from('plans').update(savePayload).eq('id', currentPlan.id);
        if (error) {
          toast.error(`Sync Error: ${error.message}`);
          fetchPlans();
        }
      } else {
        const tempPlan: Plan = {
          id: Date.now(),
          name: savePayload.name,
          description: savePayload.description || '',
          monthly_price: savePayload.monthly_price || 0,
          yearly_price: savePayload.yearly_price || 0,
          features: savePayload.features || {},
          is_active: true,
        };
        setPlans(prev => [...prev, tempPlan]);
        setIsEditing(false);
        toast.success('New licensing tier generated');

        const { error } = await supabase.from('plans').insert([savePayload]);
        if (error) {
          toast.error(`Sync Error: ${error.message}`);
          setPlans(prev => prev.filter(p => p.id !== tempPlan.id));
        }
      }
    } catch (err: any) {
      console.error('Save plan error:', err);
      toast.error(`Operation failed: ${err?.message}`);
    }
  };

  const featureLabels: Record<string, string> = {
    qr_limit_unlimited: 'Unlimited QR Orders',
    kds: 'Kitchen Display (KDS)',
    reports: 'Sales Reports',
    upi: 'Integrated UPI',
    analytics: 'Business Analytics',
    menu_management: 'Menu Management',
    voice_assistant: 'Dhara Voice Assistant',
    whatsapp_alerts: 'WhatsApp Notifications',
    inventory_management: 'Inventory Tracking',
    thermal_printing: 'Thermal Printing',
    customer_database: 'Customer CRM',
    priority_support: 'Priority Support',
    regional_languages: 'All Languages',
    custom_branding: 'Private Branding',
    staff_accounts: 'Staff Logins',
    multi_terminal: 'Multi-Terminal Sync',
    smart_inventory: 'Elite Smart Inventory',
    magic_feedback: 'Magic Feedback loop',
    order_speedometer: 'Order Speedometer',
    max_devices: 'Concurrent Device Limit'
  };

  const toggleFeature = (feature: string) => {
    const currentFeatures = currentPlan.features || {};
    setCurrentPlan({
      ...currentPlan,
      features: {
        ...currentFeatures,
        [feature]: !currentFeatures[feature]
      }
    });
  };

  const togglePlanStatus = async (plan: Plan) => {
    const newStatus = !plan.is_active;
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: newStatus } : p));
    toast.success(`Plan visibility ${newStatus ? 'restored' : 'restricted'}`);
    
    const { error } = await supabase
      .from('plans')
      .update({ is_active: newStatus })
      .eq('id', plan.id);

    if (error) {
      toast.error(`Sync failed: ${error.message}`);
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: plan.is_active } : p));
    }
  };

  const deletePlanPermanently = async (id: number) => {
    if (!confirm('EXTERMINATE: This tiers data will be purged. Continue?')) return;
    
    const backup = plans;
    setPlans(prev => prev.filter(p => p.id !== id));
    
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) {
      toast.error(`Purge rejected: ${error.message}`);
      setPlans(backup);
    } else {
      toast.success('Tier purged from network');
      if (currentIndex >= backup.length - 1) {
        setCurrentIndex(Math.max(0, backup.length - 2));
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-40">
       <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin mb-6" />
       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Syncing Licensing Protocols...</p>
    </div>
  );

  if (fetchError) return (
    <GlassCard intensity="high" className="p-20 border-red-500/20 bg-red-500/5 text-center space-y-6">
      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
         <XCircle size={32} />
      </div>
      <p className="text-red-500 font-black uppercase tracking-widest text-sm">Synchronicity Error: {fetchError}</p>
      <Button onClick={() => fetchPlans(false)} variant="primary">Attempt Resync</Button>
    </GlassCard>
  );

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <motion.h1 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none"
           >
             Licensing <span className="text-brand-primary">Tiers</span>
           </motion.h1>
           <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 flex items-center gap-2">
             <Settings2 size={12} className="text-brand-primary" />
             Strategic Pricing & Feature Matrix
           </p>
        </div>
        {!isEditing && (
          <Button onClick={() => { 
            setIsEditing(true); 
            setCurrentPlan({
               name: '', description: '', monthly_price: 0, yearly_price: 0,
               features: {
                 qr_limit_unlimited: false, kds: false, reports: false, upi: false,
                 analytics: false, menu_management: false, voice_assistant: false,
                 whatsapp_alerts: false, inventory_management: false, thermal_printing: false,
                 customer_database: false, priority_support: false, regional_languages: false,
                 custom_branding: false, staff_accounts: false, multi_terminal: false,
                 smart_inventory: false, magic_feedback: false, order_speedometer: false,
                 max_devices: 1
               },
               is_active: true
            }); 
          }} className="h-14 px-8 !rounded-2xl shadow-glow-green" variant="primary">
            <Plus size={20} className="mr-2" /> 
            Generate New Tier
          </Button>
        )}
      </div>

      {isEditing ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <GlassCard intensity="high" className="p-10 border-white/40 dark:border-white/10 shadow-2xl space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <Input label="Name" value={currentPlan.name} onChange={(e) => setCurrentPlan({...currentPlan, name: e.target.value})} placeholder="Premium Gold" />
               <Input label="Tagline" value={currentPlan.description} onChange={(e) => setCurrentPlan({...currentPlan, description: e.target.value})} placeholder="For Hyper-growth" />
               <Input label="Monthly (₹)" type="number" value={currentPlan.monthly_price} onChange={(e) => setCurrentPlan({...currentPlan, monthly_price: Number(e.target.value)})} />
               <Input label="Yearly (₹)" type="number" value={currentPlan.yearly_price} onChange={(e) => setCurrentPlan({...currentPlan, yearly_price: Number(e.target.value)})} />
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                    <Zap size={14} className="text-brand-primary" /> Feature Gating Matrix
                  </h3>
                   <div className="flex items-center gap-4">
                      <div className="w-32">
                         <Input 
                           label="Max Devices" 
                           type="number" 
                           value={currentPlan.features?.max_devices || 1} 
                           onChange={(e) => setCurrentPlan({
                             ...currentPlan, 
                             features: { ...currentPlan.features, max_devices: Number(e.target.value) }
                           })} 
                         />
                      </div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-6">Toggle Access Points</div>
                   </div>
               </div>
               
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                   {Object.keys(featureLabels).map((f) => {
                     if (f === 'max_devices') return null;
                     const isEnabled = !!currentPlan.features?.[f];
                     return (
                       <button
                         key={f}
                         onClick={() => toggleFeature(f)}
                         className={`group p-4 rounded-2xl font-black text-[10px] flex items-center justify-between border-2 transition-all text-left uppercase tracking-tight relative overflow-hidden ${
                           isEnabled 
                             ? 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary shadow-glow-green/10' 
                             : 'border-white/20 dark:border-white/5 text-slate-400 opacity-60'
                         }`}
                       >
                         <div className="relative z-10 flex flex-col gap-1">
                            <span>{featureLabels[f]}</span>
                            <span className={`text-[8px] font-bold ${isEnabled ? 'text-brand-primary' : 'text-slate-500'}`}>
                              {isEnabled ? 'Enabled / Active' : 'Restricted / Latched'}
                            </span>
                         </div>
                         <div className="relative z-10 shrink-0">
                            {isEnabled ? <CheckCircle2 size={16} className="text-brand-primary" /> : <XCircle size={16} className="text-slate-500" />}
                         </div>
                         {isEnabled && <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none" />}
                       </button>
                     );
                   })}
                </div>
            </div>

            <div className="flex gap-4 pt-10 border-t border-white/10">
               <Button variant="ghost" onClick={() => setIsEditing(false)} className="flex-1 h-14 !rounded-2xl font-black uppercase tracking-widest text-slate-500">
                  Abort Editing
               </Button>
               <Button onClick={handleSave} className="flex-2 h-14 !rounded-2xl shadow-glow-green" variant="primary">
                  Commit To Network Tier ✓
               </Button>
            </div>
          </GlassCard>
        </motion.div>
      ) : (
        <div className="relative w-full max-w-6xl mx-auto min-h-[48rem] flex flex-col items-center justify-center overflow-hidden py-10 mt-4 rounded-[4rem]">
          {/* Background mesh for carousel */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-96 bg-brand-primary/5 blur-[120px] rounded-full -z-10" />

          {plans.length > 0 && (
            <div className="absolute top-4 right-10 flex gap-4 z-50">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="w-14 h-14 !rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl"
              >
                <ChevronLeft size={24} strokeWidth={3} />
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setCurrentIndex(prev => Math.min(plans.length - 1, prev + 1))}
                disabled={currentIndex === plans.length - 1}
                className="w-14 h-14 !rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl"
              >
                <ChevronRight size={24} strokeWidth={3} />
              </Button>
            </div>
          )}

          <div className="relative w-full h-[40rem] flex items-center justify-center perspective-[1500px]">
            <AnimatePresence mode="popLayout">
              {plans.map((plan, index) => {
                const isActive = index === currentIndex;
                const offset = index - currentIndex;
                const absOffset = Math.abs(offset);
                
                if (absOffset > 2) return null;

                return (
                  <motion.div 
                    key={plan.id} 
                    initial={{ opacity: 0, x: offset * 400, scale: 0.8, z: -200 }}
                    animate={{ 
                      opacity: isActive ? 1 : Math.max(0, 0.9 - (absOffset * 0.4)), 
                      x: offset * 380, 
                      scale: isActive ? 1 : 0.82 - (absOffset * 0.05),
                      zIndex: 20 - absOffset,
                      filter: isActive ? 'blur(0px)' : `blur(${absOffset * 4}px)`,
                      rotateY: offset * -20
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(_, { offset, velocity }) => {
                      const swipe = Math.abs(offset.x) * velocity.x;
                      if (swipe < -500) setCurrentIndex(prev => Math.min(plans.length - 1, prev + 1));
                      else if (swipe > 500) setCurrentIndex(prev => Math.max(0, prev - 1));
                    }}
                    className="absolute w-full max-w-[340px] md:max-w-[400px]"
                  >
                     <GlassCard 
                        intensity={isActive ? "high" : "low"} 
                        className={`p-10 border-2 transition-all duration-500 flex flex-col h-[36rem] overflow-hidden relative ${
                          isActive 
                            ? 'shadow-glow-green/20 border-brand-primary/30 cursor-grab active:cursor-grabbing border-b-8' 
                            : 'cursor-pointer hover:border-white/40 border-white/10 dark:border-white/5 opacity-60'
                        } ${!plan.is_active ? 'grayscale opacity-40' : ''}`}
                     >
                        {!plan.is_active && (
                          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-red-500 rounded-full shadow-2xl">
                             <span className="text-white text-[9px] font-black uppercase tracking-[0.3em]">Restricted Tier</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-8">
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={14} className="text-brand-primary" />
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic truncate">{plan.name}</h3>
                             </div>
                             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] truncate">{plan.description}</p>
                           </div>
                           
                           <AnimatePresence>
                              {isActive && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-2.5">
                                   <Button 
                                     variant="ghost"
                                     size="sm"
                                     onClick={(e) => { e.stopPropagation(); setIsEditing(true); setCurrentPlan(plan); }} 
                                     className="w-10 h-10 !p-0 bg-brand-secondary/10 text-brand-secondary rounded-xl hover:scale-110 active:scale-95 transition-all border border-brand-secondary/10"
                                   >
                                     <Edit3 size={16} />
                                   </Button>
                                   <Button 
                                     variant="ghost"
                                     size="sm"
                                     onClick={(e) => { e.stopPropagation(); togglePlanStatus(plan); }} 
                                     className={`w-10 h-10 !p-0 rounded-xl hover:scale-110 active:scale-95 transition-all border ${plan.is_active ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/10'}`}
                                   >
                                     {plan.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                                   </Button>
                                   <Button 
                                     variant="ghost"
                                     size="sm"
                                     onClick={(e) => { e.stopPropagation(); deletePlanPermanently(plan.id); }} 
                                     className="w-10 h-10 !p-0 bg-red-500/10 text-red-500 rounded-xl hover:scale-110 active:scale-95 transition-all border border-red-500/10"
                                   >
                                     <Trash2 size={16} />
                                   </Button>
                                </motion.div>
                              )}
                           </AnimatePresence>
                        </div>

                        <div className="flex gap-5 mb-10">
                           <div className="flex-1 min-w-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md p-5 rounded-[2rem] text-center border border-white/40 dark:border-white/5 group-hover:scale-105 transition-transform overflow-hidden">
                              <div className="flex items-center justify-center gap-1.5 mb-1.5 opacity-60">
                                 <CreditCard size={10} className="text-slate-400 shrink-0" />
                                 <p className="text-[9px] font-black text-slate-800 dark:text-white uppercase tracking-widest truncate">Monthly</p>
                              </div>
                              <p className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter truncate leading-none">₹{plan.monthly_price || 0}</p>
                           </div>
                           <div className="flex-1 min-w-0 bg-brand-primary/10 p-5 rounded-[2rem] text-center border border-brand-primary/30 shadow-glow-green/10 group-hover:scale-105 transition-transform overflow-hidden">
                              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                 <Zap size={10} className="text-brand-primary shrink-0" />
                                 <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest truncate">Yearly</p>
                              </div>
                              <p className="text-xl sm:text-2xl md:text-3xl font-black text-brand-primary italic tracking-tighter truncate leading-none">₹{plan.yearly_price || 0}</p>
                           </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-3 custom-scrollbar">
                           <div className="flex items-center justify-between opacity-40">
                              <span className="text-[8px] font-black uppercase tracking-[0.4em]">Integrated Features</span>
                              <div className="h-px flex-1 bg-slate-400/20 ml-4" />
                           </div>
                           {Object.entries(plan.features || {}).map(([f, enabled]) => (
                             <div key={f} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${enabled ? 'bg-white/30 dark:bg-white/5 border-white/40 dark:border-white/10' : 'bg-transparent border-transparent opacity-30 grayscale'}`}>
                                <div className="flex items-center gap-3">
                                   <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${enabled ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-100 text-slate-400'}`}>
                                      {enabled ? <ShieldCheck size={14} strokeWidth={3} /> : <XCircle size={14} strokeWidth={3} />}
                                   </div>
                                   <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[160px]">{featureLabels[f] || f.replace(/_/g, ' ')}</span>
                                </div>
                                {enabled && (
                                   <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse shadow-glow-green" />
                                )}
                             </div>
                           ))}
                        </div>
                     </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {plans.length === 0 && (
              <GlassCard intensity="low" className="p-24 border-dashed border-2 border-white/20 text-center space-y-6">
                 <div className="w-20 h-20 bg-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto opacity-20 animate-pulse">
                    <Sparkles size={40} className="text-slate-400" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">No licensing tiers detected on network</p>
              </GlassCard>
            )}
          </div>

          {/* Dots Pagination */}
          {plans.length > 0 && (
            <div className="flex gap-4 mt-12 z-50">
              {plans.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    i === currentIndex 
                      ? 'bg-brand-primary w-12 shadow-glow-green/50' 
                      : 'bg-white/20 hover:bg-white/40 w-2.5'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
