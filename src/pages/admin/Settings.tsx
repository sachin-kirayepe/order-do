import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  ShieldCheck, 
  SwitchCamera, 
  Gift, 
  Lock, 
  Key,
  Globe,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [globalFree, setGlobalFree] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('admin_settings').select('*').eq('key', 'global_free_toggle').single();
      if (data) setGlobalFree(data.value === true || data.value === 'true');
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const toggleGlobalFree = async () => {
    const newValue = !globalFree;
    const { error } = await supabase.from('admin_settings').upsert({
      key: 'global_free_toggle',
      value: newValue
    });

    if (!error) {
      setGlobalFree(newValue);
      toast.success(newValue ? 'Global Free Mode: ENABLED' : 'Global Free Mode: DISABLED');
    }
  };

  if (loading) return <div className="animate-pulse">Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
         <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-widest uppercase italic font-outfit">Platform Settings</h1>
         <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 font-outfit">Global Toggles & Security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-outfit">
        {/* GLOBAL FREE TOGGLE */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-8 rounded-[3rem] border-2 transition-all cursor-pointer flex flex-col items-center text-center justify-between gap-6 ${
            globalFree 
              ? 'bg-kirana-green border-kirana-green shadow-2xl shadow-kirana-green/30' 
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
          }`}
          onClick={toggleGlobalFree}
        >
           <div className={`p-4 rounded-3xl ${globalFree ? 'bg-white text-kirana-green' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
              <Gift size={32} />
           </div>
           
           <div>
              <h2 className={`text-xl font-black uppercase tracking-tighter italic ${globalFree ? 'text-white' : 'text-slate-800 dark:text-white'}`}>Make Everything Free</h2>
              <p className={`text-xs font-medium mt-1 ${globalFree ? 'text-white/80' : 'text-slate-400'}`}>
                Switch this on to unlock all premium features for all shops globally. Use for promotions or festivals.
              </p>
           </div>

           <div className={`w-16 h-8 rounded-full p-1 transition-colors duration-500 ${globalFree ? 'bg-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-6 h-6 rounded-full transition-transform duration-500 ${globalFree ? 'bg-kirana-green translate-x-8' : 'bg-white dark:bg-slate-500'}`} />
           </div>
        </motion.div>

        {/* SECURITY & MAINTENANCE */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Lock size={12} /> Maintenance Mode
           </p>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                 <div className="flex items-center gap-3 font-bold text-sm text-slate-600 dark:text-slate-300">
                    <Globe size={18} /> Public Access
                 </div>
                 <div className="w-10 h-5 bg-kirana-green rounded-full p-1">
                    <div className="w-3 h-3 bg-white rounded-full translate-x-5" />
                 </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                 <div className="flex items-center gap-3 font-bold text-sm text-slate-600 dark:text-slate-300">
                    <Key size={18} /> API Key
                 </div>
                 <button className="text-[10px] bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-lg font-black uppercase tracking-widest text-slate-500">Rotate</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
