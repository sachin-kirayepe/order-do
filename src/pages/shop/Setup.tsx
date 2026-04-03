import { useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import db from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Store, User, Phone, MapPin, UtensilsCrossed, Plus, Trash2, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import { generateUniqueQrCode } from '../../utils/qrUniqueness';

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
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const uniqueShopId = `ORDERDO-LKO-${randomId}`;

      const userId = user?.id || `local-${Date.now()}`;

      // Generate Master QR Unique Code
      const masterQrCode = generateUniqueQrCode(uniqueShopId);

      // Save Profile
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
      
      // SYNC TO SUPABASE (ADMIN PANEL TRACKING)
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
      }

      // Log to QR History
      await db.qrHistory.add({
        code: masterQrCode,
        shopId: uniqueShopId,
        type: 'master',
        createdAt: Date.now()
      });

      // Save Menu Items
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-10 dark:opacity-5 mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'url("/assets/bg-kirana.png")' }}
      />

      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full glass-panel p-8 rounded-2xl relative z-10 border border-white/20">
        <AnimatePresence mode="wait">
          {step === 'profile' && (
            <motion.div
              key="profile"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2 uppercase tracking-tight">{t('setup.title')}</h2>
              <p className="text-center text-slate-500 mb-6 text-sm">{t('setup.subTitle')}</p>
              
              <form onSubmit={(e) => { e.preventDefault(); setStep('menu'); }} className="space-y-4">
                <Input 
                  label={t('setup.shopName')} 
                  value={shopName} 
                  onChange={(e) => setShopName(e.target.value)} 
                  icon={<Store size={18} />} 
                  required
                />
                <Input 
                  label={t('setup.ownerName')} 
                  value={ownerName} 
                  onChange={(e) => setOwnerName(e.target.value)} 
                  icon={<User size={18} />} 
                  required
                />
                <Input 
                  label={t('setup.phone')} 
                  type="tel"
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  icon={<Phone size={18} />} 
                />
                <Input 
                  label={t('setup.address')} 
                  value={address} 
                  onChange={(e: any) => setAddress(e.target.value)} 
                  icon={<MapPin size={18} />} 
                />
                <Input 
                  label={t('setup.upiId')} 
                  value={upiId} 
                  onChange={(e: any) => setUpiId(e.target.value)} 
                  icon={<IndianRupee size={18} />} 
                  placeholder="e.g. shopname@upi"
                />
                
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('setup.shopType')}
                  </label>
                  <select 
                    className="block w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-kirana-green focus:border-kirana-green px-4 py-2.5 sm:text-sm"
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

                <div className="pt-4">
                  <Button type="submit" className="w-full">{t('common.next')}</Button>
                </div>
              </form>
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
              <div className="text-center">
                <div className="w-16 h-16 bg-kirana-orange/10 text-kirana-orange rounded-full flex items-center justify-center mx-auto mb-4">
                  <UtensilsCrossed size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('setup.menu.title')}</h2>
                <p className="text-slate-500 text-sm">{t('setup.menu.desc')}</p>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {menuItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input 
                        placeholder={t('setup.menu.itemName')} 
                        value={item.name} 
                        onChange={(e) => handleUpdateMenuItem(idx, 'name', e.target.value)} 
                      />
                    </div>
                    <div className="w-24">
                      <Input 
                        placeholder="₹" 
                        type="number"
                        value={item.price} 
                        onChange={(e) => handleUpdateMenuItem(idx, 'price', e.target.value)} 
                      />
                    </div>
                    <button 
                      onClick={() => handleRemoveMenuItem(idx)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={handleAddMenuItem}
                  className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-kirana-green hover:border-kirana-green transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  <span className="font-medium">{t('setup.menu.addItem')}</span>
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                 <Button variant="secondary" onClick={() => setStep('profile')} className="flex-1">{t('common.back')}</Button>
                <Button onClick={handleFinalSubmit} isLoading={loading} className="flex-1">
                  {menuItems.length > 0 ? t('setup.menu.saveMenu') : t('setup.menu.finish')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
