import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  CreditCard,
  IndianRupee,
  X,
  Copy,
  Zap,
  Cpu,
  Fingerprint,
  Radio,
  ArrowRight
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';

interface Plan {
  id: number;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  features: Record<string, boolean>;
  is_active: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  qr_limit_unlimited: 'Unlimited QR Orders',
  kds: 'Kitchen Display (KDS)',
  reports: 'Sales Reports',
  upi: 'Integrated UPI',
  analytics: 'Business Analytics',
  menu_management: 'Menu Management',
  voice_assistant: 'Dhara Voice Assistant',
  whatsapp_alerts: 'WhatsApp Alerts',
  inventory_management: 'Inventory Tracking',
  thermal_printing: 'Thermal Printing',
  customer_database: 'Customer CRM',
  priority_support: 'Priority Support',
  regional_languages: 'All Languages',
  custom_branding: 'Private Branding',
  staff_accounts: 'Staff Logins',
  multi_terminal: 'Multi-Terminal Sync',
  max_devices: 'Concurrent Device Limit'
};

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentType, setPaymentType] = useState<'monthly' | 'yearly'>('monthly');
  const [utr, setUtr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('id', { ascending: true });
        if (error) throw error;
        if (data) setPlans(data);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handlePurchase = async () => {
    if (!user) {
      toast.error('GUEST ACCESS: Please authorize as a shopkeeper first');
      navigate('/shop/login');
      return;
    }

    if (!utr.trim()) {
      toast.error('PROTOCOL ERROR: Mandatory UTR telemetry missing');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: shopProfile } = await supabase
        .from('shops_profile')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!shopProfile) {
        toast.error('NODE NOT FOUND: Complete shop initialization first.');
        setIsSubmitting(false); // FIXED: Prevent permanent loading state
        return;
      }

      const { error } = await supabase.from('payments').insert([{
        shop_id: user.id,
        plan_id: selectedPlan?.id,
        amount: paymentType === 'monthly' ? selectedPlan?.monthly_price : selectedPlan?.yearly_price,
        duration_days: paymentType === 'monthly' ? 30 : 365,
        utr: utr.trim(),
        status: 'pending'
      }]);

      if (error) throw error;

      toast.success('PAYLOAD SENT: Admin will verify and activate your node shortly.');
      setSelectedPlan(null);
      setUtr('');
    } catch (err: any) {
      console.error('Payment submission full error:', err);
      toast.error(err.message || 'TRANSMISSION FAILURE: Uplink rejected');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-20 gap-8">
       <div className="w-20 h-20 bg-brand-primary/10 rounded-[2.5rem] flex items-center justify-center border border-brand-primary/20 animate-pulse">
          <Cpu className="text-brand-primary animate-spin-slow" size={40} />
       </div>
       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Fetching Tiers...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-primary/30 py-20 px-8 relative overflow-hidden">
      {/* Immersive Background Nodes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/5 blur-[120px] rounded-full -ml-40 -mb-40 pointer-events-none" />

      <div className="max-w-6xl mx-auto text-center mb-20 space-y-8 relative">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-flex items-center gap-3 px-6 py-2 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20 text-[10px] font-black uppercase tracking-[0.4em] italic mb-4"
        >
           <Sparkles size={14} className="animate-pulse" /> Infrastructure Scale
        </motion.div>
        
        <div className="space-y-6">
           <h1 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none">
              Accelerate Your <span className="text-brand-primary">Growth</span>
           </h1>
           <p className="text-lg md:text-2xl text-slate-400 font-bold max-w-3xl mx-auto italic leading-relaxed">
              Empower your node with premium operational capacity. Engineered for precision and limitless scale.
           </p>
        </div>
      </div>

      <div className="relative w-full max-w-6xl mx-auto min-h-[48rem] flex flex-col items-center justify-center">
          {plans.length > 0 && (
            <div className="absolute top-0 right-0 left-0 flex justify-center md:justify-end gap-6 z-50 px-8">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="w-14 h-14 !p-0 !rounded-2xl bg-white/5 text-slate-400 disabled:opacity-20 border border-white/5 active:scale-90"
              >
                <ChevronLeft size={28} strokeWidth={3} />
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setCurrentIndex(prev => Math.min(plans.length - 1, prev + 1))}
                disabled={currentIndex === plans.length - 1}
                className="w-14 h-14 !p-0 !rounded-2xl bg-white/5 text-slate-400 disabled:opacity-20 border border-white/5 active:scale-90"
              >
                <ChevronRight size={28} strokeWidth={3} />
              </Button>
            </div>
          )}

          <div className="relative w-full h-[40rem] flex items-center justify-center perspective-[2000px] mt-20 md:mt-0">
            <AnimatePresence mode="popLayout">
              {plans.map((plan, index) => {
                const isActive = index === currentIndex;
                const offset = index - currentIndex;
                const absOffset = Math.abs(offset);
                
                if (absOffset > 2) return null;

                return (
                  <motion.div 
                    key={plan.id} 
                    initial={{ opacity: 0, x: offset * 400, scale: 0.8, rotateY: offset * -15 }}
                    animate={{ 
                      opacity: isActive ? 1 : Math.max(0, 1 - (absOffset * 0.5)), 
                      x: offset * 380, 
                      scale: isActive ? 1 : 0.85 - (absOffset * 0.05),
                      zIndex: 20 - absOffset,
                      filter: isActive ? 'blur(0px)' : `blur(${absOffset * 2}px)`,
                      rotateY: offset * -20 
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.8 }}
                    className={`absolute w-full max-w-[340px] md:max-w-[420px] h-full ${isActive ? 'pointer-events-auto' : 'pointer-events-none cursor-pointer hover:scale-95 transition-transform'}`}
                    onClick={() => !isActive && setCurrentIndex(index)}
                  >
                     <GlassCard 
                       intensity={isActive ? "high" : "low"} 
                       className={`p-10 flex flex-col h-full border-2 border-white/5 transition-all duration-500 shadow-2xl overflow-hidden relative ${
                         isActive ? 'border-brand-primary shadow-glow-green/10 -translate-y-4' : 'opacity-40 grayscale-[0.5]'
                       }`}
                     >
                        <div className="mb-8 relative z-10">
                           <div className="flex items-center justify-between mb-2">
                              <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic truncate">{plan.name}</h3>
                              {isActive && <Zap size={24} className="text-brand-primary animate-pulse" />}
                           </div>
                           <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed mt-2 line-clamp-2 h-10 opacity-60 italic">{plan.description}</p>
                        </div>

                        <div className="flex gap-4 mb-10 relative z-10">
                           <div className="flex-1 min-w-0 bg-white/5 backdrop-blur-3xl p-6 rounded-[2rem] text-center border border-white/5 shadow-inner overflow-hidden">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Standard</p>
                              <div className="flex items-center justify-center gap-1">
                                 <IndianRupee size={14} className="text-slate-400 shrink-0" />
                                 <p className="text-xl sm:text-2xl md:text-3xl font-black text-white italic tracking-tighter truncate leading-none">
                                    {plan.monthly_price === 0 ? 'FREE' : plan.monthly_price}
                                 </p>
                              </div>
                              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">/ Month</p>
                           </div>
                           <div className="flex-1 min-w-0 bg-brand-primary/10 backdrop-blur-3xl p-6 rounded-[2rem] text-center border-2 border-brand-primary/20 shadow-glow-green/5 group overflow-hidden">
                              <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-2 italic">Unlimited</p>
                              <div className="flex items-center justify-center gap-1 group-hover:scale-110 transition-transform">
                                 <IndianRupee size={16} className="text-brand-primary shrink-0" />
                                 <p className="text-2xl sm:text-3xl md:text-4xl font-black text-brand-primary italic tracking-tighter truncate leading-none">
                                    {plan.yearly_price === 0 ? 'FREE' : plan.yearly_price}
                                 </p>
                              </div>
                              <p className="text-[8px] font-black text-brand-primary/60 uppercase tracking-widest mt-1 italic">/ Year</p>
                           </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-4 mb-10 relative z-10 overflow-hidden">
                           <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic mb-4">Core Capacities</p>
                           {Object.keys(FEATURE_LABELS).map((fKey) => {
                             const featureValue = plan.features ? plan.features[fKey] : undefined;
                             const isEnabled = featureValue === true || (typeof featureValue === 'number' && featureValue > 0);
                             
                             return (
                               <div key={fKey} className={`flex items-center gap-4 text-[10px] font-black uppercase tracking-widest transition-all ${isEnabled ? 'text-white' : 'text-slate-800 opacity-20 line-through'}`}>
                                 <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${isEnabled ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary shadow-glow-green/10' : 'bg-white/5 border-white/5 text-slate-800'}`}>
                                    {isEnabled ? <CheckCircle2 size={14} strokeWidth={3} /> : <XCircle size={14} strokeWidth={3} />}
                                 </div>
                                 <span className="truncate italic">
                                   {fKey === 'max_devices' && isEnabled 
                                     ? `Active Terminals: ${featureValue}` 
                                     : FEATURE_LABELS[fKey]}
                                 </span>
                               </div>
                             );
                           })}
                        </div>

                        {isActive && (
                           <Button 
                             onClick={() => setSelectedPlan(plan)}
                             variant="primary"
                             className="w-full h-20 !rounded-[2rem] shadow-glow-green group overflow-hidden relative"
                           >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <span className="relative z-10 flex items-center justify-center gap-3 text-sm font-black uppercase italic tracking-widest">
                                 Activate Node <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                              </span>
                           </Button>
                        )}
                        
                        {/* Background Aesthetic Layer */}
                        <div className={`absolute top-0 right-0 w-32 h-full -z-10 blur-[60px] opacity-10 transition-colors ${isActive ? 'bg-brand-primary' : 'bg-slate-900 opacity-5'}`} />
                     </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Dots Telemetry */}
          {plans.length > 0 && (
            <div className="flex gap-4 mt-20 z-50">
              {plans.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    i === currentIndex ? 'bg-brand-primary w-16 shadow-glow-green' : 'bg-white/10 w-2.5 hover:bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
      </div>

      <div className="mt-40 max-w-4xl mx-auto space-y-12 opacity-30 group hover:opacity-100 transition-opacity text-center">
         <div className="flex items-center justify-center gap-10">
            <div className="flex items-center gap-3">
               <ShieldCheck size={18} className="text-brand-primary" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Enterprise Encryption Standard</span>
            </div>
            <div className="flex items-center gap-3">
               <Fingerprint size={18} className="text-brand-secondary" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Biometric Identity Secure</span>
            </div>
         </div>
         <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500">Node Architecture Protocol // Plans v4.1 // India Data Centre</p>
      </div>

      {/* PURCHASE MODAL - THE GATEWAY */}
      <AnimatePresence>
         {selectedPlan && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl"
               onClick={() => setSelectedPlan(null)}
            >
               <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(34,197,94,0.1)] overflow-hidden relative"
               >
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full -z-10" />

                  <div className="p-10 border-b border-white/5 relative">
                     <button onClick={() => setSelectedPlan(null)} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white bg-white/5 rounded-full transition-all hover:rotate-90">
                        <X size={20} />
                     </button>
                     <div className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center mb-6 border border-brand-primary/20 shadow-glow-green/5">
                        <CreditCard className="text-brand-primary" size={32} />
                     </div>
                     <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">Protocol <span className="text-brand-primary">Settlement</span></h2>
                     <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic">Uplink Activation: {selectedPlan.name}</p>
                  </div>

                  <div className="p-10 space-y-10">
                     <div className="p-1.5 bg-slate-950/50 backdrop-blur-xl border border-white/5 rounded-2xl shadow-inner flex">
                        <button 
                           onClick={() => setPaymentType('monthly')}
                           className={`flex-1 py-4 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all truncate italic ${paymentType === 'monthly' ? 'bg-brand-primary text-white shadow-glow-green' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                           Monthly (₹{selectedPlan.monthly_price})
                        </button>
                        <button 
                           onClick={() => setPaymentType('yearly')}
                           className={`flex-1 py-4 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all truncate italic ${paymentType === 'yearly' ? 'bg-brand-primary text-white shadow-glow-green' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                           Yearly (₹{selectedPlan.yearly_price})
                        </button>
                     </div>

                     <div className="bg-brand-primary/5 p-8 rounded-[2.5rem] border border-brand-primary/10 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                           <Radio size={120} />
                        </div>
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                           <div className="w-10 h-10 rounded-xl bg-brand-primary text-slate-950 flex items-center justify-center shadow-glow-green group-hover:scale-110 transition-transform">
                              <IndianRupee size={20} strokeWidth={3} />
                           </div>
                           <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Phase 1: Relay Hub Transfer</h3>
                        </div>
                        <div className="flex items-center justify-between gap-4 p-5 bg-slate-950 rounded-2xl border border-white/5 shadow-inner group">
                           <span className="text-xs font-black text-brand-primary font-mono tracking-widest truncate">sachinkumar647422.payments@oksbi</span>
                           <Button 
                             onClick={() => { navigator.clipboard.writeText('sachinkumar647422.payments@oksbi'); toast.success('RELAY ID COPIED'); }} 
                             variant="ghost"
                             className="!p-0 h-10 w-10 !rounded-xl text-brand-primary hover:bg-brand-primary/10"
                           >
                              <Copy size={18} />
                           </Button>
                        </div>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-4 leading-relaxed italic pr-12">Authorized for GooglePay, PhonePe, Paytm, and all regional UPI clusters.</p>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-brand-secondary text-white flex items-center justify-center shadow-glow-secondary">
                              <ShieldCheck size={20} strokeWidth={3} />
                           </div>
                           <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Phase 2: Payload Verification</h3>
                        </div>
                        <div className="space-y-4">
                           <Input 
                              placeholder="12-DIGIT PROTOCOL UTR" 
                              value={utr}
                              onChange={(e) => setUtr(e.target.value)}
                              className="h-16 bg-white/5 border-white/10 focus:border-brand-primary font-mono text-center tracking-[0.4em] font-black text-lg transition-all"
                           />
                           <div className="flex items-center gap-3 px-2">
                              <Zap size={14} className="text-brand-secondary" />
                              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Verify your transmission using the reference ID from your banking interface.</p>
                           </div>
                        </div>
                     </div>

                     <Button 
                        onClick={handlePurchase}
                        disabled={isSubmitting}
                        variant="primary"
                        className="w-full h-20 !rounded-[2rem] shadow-glow-green text-sm font-black uppercase italic tracking-[0.4em]"
                     >
                        {isSubmitting ? 'Verifying Link...' : 'Confirm Transmission ✓'}
                     </Button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
