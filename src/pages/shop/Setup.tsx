import { useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import db from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Store, UtensilsCrossed, Plus, Trash2, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import { generateUniqueQrCode } from '../../utils/qrUniqueness';
import VoiceSettings from '../../components/shopkeeper/VoiceSettings';

type SetupStep = 'profile' | 'menu';

export default function Setup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  
  const [step, setStep] = useState<SetupStep>('profile');

  // Step 1: Profile
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [shopType, setShopType] = useState('Kirana');

  // Step 2: Menu
  const [menuItems, setMenuItems] = useState<{name: string, price: string}[]>([]);

  const handleAddMenuItem = () => {
    setMenuItems([...menuItems, { name: '', price: '' }]);
  };

  const handleUpdateMenuItem = (index: number, field: 'name' | 'price', value: string) => {
    const fresh = [...menuItems];
    fresh[index][field] = value;
    setMenuItems(fresh);
  };

  const handleRemoveMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now().toString(36).toUpperCase();
      const cryptoRandom = Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      const uniqueShopId = `ORDERDO-${timestamp}-${cryptoRandom}`;

      const userId = user?.id || `local-${Date.now()}`;
      const masterQrCode = generateUniqueQrCode(uniqueShopId);

      await db.shopProfile.put({
        id: userId,
        shopId: uniqueShopId,
        shopName,
        ownerName,
        phone,
        address,
        upiId,
        shopType,
        masterQrCode,
        hasMenu: menuItems.length > 0,
        createdAt: Date.now()
      });
      
      try {
        if (user?.id) {
          await supabase.from('shops_profile').upsert({
            id: user.id,
            shop_id: uniqueShopId,
            shop_name: shopName,
            owner_name: ownerName,
            phone: phone,
            address: address,
            upi_id: upiId,
            shop_type: shopType
          });

          // AUTO-INITIALIZE: Create a Free Subscription (ID: 16)
          // Set expiry to far future or standard term
          const farFuture = new Date();
          farFuture.setFullYear(farFuture.getFullYear() + 10);

          await supabase.from('subscriptions').upsert({
            shop_id: user.id,
            plan_id: 16, // Free Plan
            status: 'active',
            expiry_date: farFuture.toISOString()
          }, { onConflict: 'shop_id' });
        }
      } catch (syncErr) {
        console.warn('[Setup] Supabase cloud sync failed:', syncErr);
      }

      await db.qrHistory.add({
        code: masterQrCode,
        shopId: uniqueShopId,
        type: 'master',
        createdAt: Date.now()
      });

      if (menuItems.length > 0) {
        const itemsToSave = menuItems
          .filter(item => item.name && item.price)
          .map(item => ({
            shopId: uniqueShopId,
            name: item.name,
            price: parseFloat(item.price),
            available: true
          }));
        
        if (itemsToSave.length > 0) {
          await db.menuItems.bulkAdd(itemsToSave);
        }
      }

      navigate('/shop/dashboard');
    } catch (err) {
      console.error(err);
      alert(t('setup.saveError'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[1.25rem] flex items-center justify-center mx-auto mb-4 shadow-2xl border border-white/20">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
           </div>
           <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-1">Order-<span className="text-brand-primary">Do</span> Shop</h1>
           <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{t('setup.subTitle')}</p>
        </div>

        <GlassCard intensity="high" className="p-8 border-white/40 dark:border-white/10 shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'profile' && (
              <motion.div
                key="profile"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center">
                      <Store size={20} />
                   </div>
                   <h2 className="text-xl font-black uppercase italic tracking-tighter">{t('setup.title')}</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-5">
                  <Input 
                    label={t('setup.shopName')} 
                    value={shopName} 
                    onChange={(e) => setShopName(e.target.value)} 
                    placeholder="E.g. Sharma Kirana Store"
                    required
                  />
                  <Input 
                    label={t('setup.ownerName')} 
                    value={ownerName} 
                    onChange={(e) => setOwnerName(e.target.value)} 
                    placeholder="Your Full Name"
                    required
                  />
                  <Input 
                    label={t('setup.phone')} 
                    type="tel"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="9876543210"
                  />
                  <Input 
                    label={t('setup.address')} 
                    value={address} 
                    onChange={(e: any) => setAddress(e.target.value)} 
                    placeholder="Shop Address"
                  />
                  <Input 
                    label={t('setup.upiId')} 
                    value={upiId} 
                    onChange={(e: any) => setUpiId(e.target.value)} 
                    placeholder="shop@upi"
                  />
                  
                  <div className="w-full">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      {t('setup.shopType')}
                    </label>
                    <select 
                      className="block w-full rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 text-slate-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary px-4 py-3 text-sm backdrop-blur-md transition-all appearance-none cursor-pointer"
                      value={shopType}
                      onChange={(e) => setShopType(e.target.value)}
                    >
                      <option value="Kirana">{t('setup.kirana')}</option>
                      <option value="Medical">{t('setup.medical')}</option>
                      <option value="Sabzi">{t('setup.fruits')}</option>
                      <option value="Bakery">{t('setup.bakery')}</option>
                      <option value="Restaurant">{t('setup.restaurant')}</option>
                      <option value="Others">{t('setup.others')}</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                   <VoiceSettings />
                </div>

                <Button onClick={() => setStep('menu')} className="w-full h-14 !rounded-2xl" variant="primary">
                   {t('common.next')}
                   <ChevronRight className="ml-2" size={20} />
                </Button>
              </motion.div>
            )}

            {step === 'menu' && (
              <motion.div
                key="menu"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 bg-brand-secondary/10 text-brand-secondary rounded-xl flex items-center justify-center">
                      <UtensilsCrossed size={20} />
                   </div>
                   <h2 className="text-xl font-black uppercase italic tracking-tighter">{t('setup.menu.title')}</h2>
                </div>

                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                  {menuItems.map((item, idx) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className="flex gap-2 items-start bg-white/20 dark:bg-slate-900/20 p-3 rounded-2xl border border-white/20">
                      <div className="flex-1 space-y-2">
                        <Input 
                          placeholder={t('setup.menu.itemName')} 
                          value={item.name} 
                          onChange={(e) => handleUpdateMenuItem(idx, 'name', e.target.value)} 
                          className="!py-2"
                        />
                        <Input 
                          placeholder="Price (₹)" 
                          type="number"
                          value={item.price} 
                          onChange={(e) => handleUpdateMenuItem(idx, 'price', e.target.value)} 
                          className="!py-2"
                        />
                      </div>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMenuItem(idx)}
                        className="!p-0 w-10 h-10 rounded-xl text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </motion.div>
                  ))}
                  
                  <button 
                    onClick={handleAddMenuItem}
                    className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-brand-primary hover:border-brand-primary transition-all flex items-center justify-center gap-2 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors">
                       <Plus size={18} />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest">{t('setup.menu.addItem')}</span>
                  </button>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                   <Button variant="ghost" onClick={() => setStep('profile')} className="flex-1 h-14 !rounded-2xl">
                      <ArrowLeft size={18} className="mr-2" />
                      {t('common.back')}
                   </Button>
                  <Button onClick={handleFinalSubmit} isLoading={loading} className="flex-1 h-14 !rounded-2xl shadow-glow-green" variant="primary">
                    {menuItems.length > 0 ? t('setup.menu.saveMenu') : t('setup.menu.finish')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  );
}
