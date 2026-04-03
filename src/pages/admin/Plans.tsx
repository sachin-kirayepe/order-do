import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Settings2,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'sonner';

interface Plan {
  id: number;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  features: Record<string, boolean>;
  is_active: boolean;
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({
    name: '',
    description: '',
    monthly_price: 0,
    yearly_price: 0,
    features: {
      qr_limit_unlimited: false,
      kds: false,
      reports: false,
      upi: false,
      analytics: false,
      menu_management: false
    },
    is_active: true
  });

  const fetchPlans = async () => {
    setLoading(true);
    const { data } = await supabase.from('plans').select('*').order('id', { ascending: true });
    if (data) setPlans(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async () => {
    try {
      if (currentPlan.id) {
        await supabase.from('plans').update(currentPlan).eq('id', currentPlan.id);
        toast.success('Plan updated successfully');
      } else {
        await supabase.from('plans').insert([currentPlan]);
        toast.success('New plan created');
      }
      setIsEditing(false);
      fetchPlans();
    } catch (err) {
      toast.error('Failed to save plan');
    }
  };

  const toggleFeature = (feature: string) => {
    setCurrentPlan({
      ...currentPlan,
      features: {
        ...currentPlan.features,
        //@ts-ignore
        [feature]: !currentPlan.features[feature]
      }
    });
  };

  const deletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    await supabase.from('plans').delete().eq('id', id);
    fetchPlans();
  };

  if (loading) return <div className="animate-pulse">Loading plans...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-widest uppercase italic">Subscription Plans</h1>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage Pricing & Features</p>
        </div>
        {!isEditing && (
          <Button onClick={() => { setIsEditing(true); setCurrentPlan({}); }} className="flex items-center gap-2">
            <Plus size={18} /> New Plan
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input label="Plan Name" value={currentPlan.name} onChange={(e) => setCurrentPlan({...currentPlan, name: e.target.value})} />
             <Input label="Description" value={currentPlan.description} onChange={(e) => setCurrentPlan({...currentPlan, description: e.target.value})} />
             <Input label="Monthly Price (₹)" type="number" value={currentPlan.monthly_price} onChange={(e) => setCurrentPlan({...currentPlan, monthly_price: Number(e.target.value)})} />
             <Input label="Yearly Price (₹)" type="number" value={currentPlan.yearly_price} onChange={(e) => setCurrentPlan({...currentPlan, yearly_price: Number(e.target.value)})} />
          </div>

          <div className="space-y-3">
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Settings2 size={14} /> Feature Gating
             </p>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(currentPlan.features || {}).map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFeature(f)}
                    className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between border-2 transition-all ${
                      //@ts-ignore
                      currentPlan.features?.[f] 
                        ? 'border-kirana-green bg-kirana-green/10 text-kirana-green' 
                        : 'border-slate-100 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    {f.replace(/_/g, ' ').toUpperCase()}
                    {//@ts-ignore
                    currentPlan.features?.[f] ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex gap-4 pt-4">
             <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">Cancel</Button>
             <Button onClick={handleSave} className="flex-1">Save Plan ✓</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative group overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{plan.name}</h3>
                    <p className="text-slate-400 text-xs font-medium">{plan.description}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setIsEditing(true); setCurrentPlan(plan); }} className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Edit3 size={16} /></button>
                    <button onClick={() => deletePlan(plan.id)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                  </div>
               </div>

               <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly</p>
                     <p className="text-xl font-black text-slate-800 dark:text-white italic">₹{plan.monthly_price}</p>
                  </div>
                  <div className="flex-1 bg-kirana-green/5 dark:bg-kirana-green/10 p-4 rounded-3xl text-center border border-kirana-green/10">
                     <p className="text-[10px] font-black text-kirana-green uppercase tracking-widest mb-1">Yearly</p>
                     <p className="text-xl font-black text-kirana-green italic">₹{plan.yearly_price}</p>
                  </div>
               </div>

               <div className="space-y-2">
                  {Object.entries(plan.features).map(([f, enabled]) => (
                    <div key={f} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${enabled ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-700 line-through'}`}>
                      {enabled ? <CheckCircle2 size={12} className="text-kirana-green" /> : <XCircle size={12} />}
                      {f.replace(/_/g, ' ')}
                    </div>
                  ))}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
