import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Store, 
  Calendar, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'sonner';

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
    plan: { name: string }
  }
}

export default function AdminShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchShops = async () => {
    setLoading(true);
    const { data } = await supabase.from('shops_profile').select(`
      *,
      subscription:subscriptions (
        status,
        expiry_date,
        plan:plans ( name )
      )
    `);
    if (data) setShops(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleManualActivate = async (shopId: string) => {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1); // 1 year manual extension

    const { error } = await supabase.from('subscriptions').upsert({
      shop_id: shopId,
      status: 'active',
      expiry_date: expiry.toISOString(),
      plan_id: 1 // Default to first plan if none selected
    });

    if (!error) {
       toast.success('Shop activated manually for 1 year');
       fetchShops();
    }
  };

  const filteredShops = shops.filter(s => 
    s.shop_name.toLowerCase().includes(search.toLowerCase()) || 
    s.shop_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-widest uppercase italic">Shops Directory</h1>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Management of all registered partners</p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search shops..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-kirana-green/20 focus:border-kirana-green outline-none transition-all dark:text-white"
              />
           </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
           {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredShops.map((shop, i) => (
            <motion.div
              key={shop.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-kirana-green group-hover:text-white transition-colors duration-500">
                  <Store size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{shop.shop_name}</h3>
                   <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{shop.shop_id}</p>
                      <div className="w-1 h-1 bg-slate-300 rounded-full" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{shop.shop_type}</p>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-12">
                 <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                       {shop.subscription?.status === 'active' ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-kirana-green/10 text-kirana-green rounded-full text-[10px] font-black uppercase tracking-widest">
                             <ShieldCheck size={10} /> {shop.subscription.plan?.name}
                          </div>
                       ) : (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                             <ShieldAlert size={10} /> Unsubscribed
                          </div>
                       )}
                    </div>
                    {shop.subscription?.expiry_date && (
                      <p className="text-[10px] font-medium text-slate-400 flex items-center justify-end gap-1">
                        <Calendar size={10} /> Exp: {new Date(shop.subscription.expiry_date).toLocaleDateString()}
                      </p>
                    )}
                 </div>

                 <div className="flex items-center gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => handleManualActivate(shop.id)}
                      className="px-4 py-2 text-xs h-auto rounded-xl hover:bg-kirana-green/10 hover:text-kirana-green border-slate-100 dark:border-slate-800"
                    >
                      Override
                    </Button>
                    <button className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                       <ChevronRight size={18} />
                    </button>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
