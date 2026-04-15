import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Camera, User, MapPin, ShoppingBasket, ClipboardCheck, ArrowLeft, ArrowRight, Sun, Moon, Mic, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import CameraCapture from '../../components/customer/CameraCapture';
import VoiceNameInput from '../../components/customer/VoiceNameInput';
import VoiceAddressInput from '../../components/customer/VoiceAddressInput';
import VoiceItemList from '../../components/customer/VoiceItemList';
import OrderPreview from '../../components/customer/OrderPreview';
import type { OrderItem, MenuItem, ShopProfile } from '../../db/dexie';
import db from '../../db/dexie';
import { encrypt } from '../../utils/encryption';
import { parseUnifiedTranscript } from '../../utils/unifiedParser';
import haptics from '../../utils/haptics';
import useSound from '../../hooks/useSound';
import Confetti from '../../components/ui/Confetti';
import SuccessModal from '../../components/ui/SuccessModal';
import { generateReceiptCanvas } from '../../utils/receiptGenerator';
import { useVoice } from '../../context/VoiceContext';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const getSteps = (t: any) => [
  { id: 1, label: t('customer.steps.photo'), icon: Camera },
  { id: 2, label: t('customer.steps.name'), icon: User },
  { id: 3, label: t('setup.address') || 'Address', icon: MapPin },
  { id: 4, label: t('customer.steps.items'), icon: ShoppingBasket },
  { id: 5, label: t('customer.steps.preview'), icon: ClipboardCheck },
];

export default function OrderFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const { playSuccess } = useSound();
  const { speak } = useVoice();
  const shopId = searchParams.get('shop') || '';
  const locationType = searchParams.get('type') as 'counter' | 'table' | null;
  const locationNo = searchParams.get('no') || '';

  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState('');
  const [customerName, setCustomerNameRaw] = useState('');
  const [customerPhone, setCustomerPhoneRaw] = useState('');
  const [customerAddress, setCustomerAddressRaw] = useState('');
  const [pincode, setPincode] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);

  // TC-010 FIX: Input length limiters to prevent overflow/abuse
  const setCustomerName = (v: string | ((prev: string) => string)) => {
    if (typeof v === 'function') setCustomerNameRaw(prev => v(prev).slice(0, 100));
    else setCustomerNameRaw(v.slice(0, 100));
  };
  const setCustomerPhone = (v: string | ((prev: string) => string)) => {
    if (typeof v === 'function') setCustomerPhoneRaw(prev => v(prev).replace(/[^0-9+]/g, '').slice(0, 15));
    else setCustomerPhoneRaw(v.replace(/[^0-9+]/g, '').slice(0, 15));
  };
  const setCustomerAddress = (v: string | ((prev: string) => string)) => {
    if (typeof v === 'function') setCustomerAddressRaw(prev => v(prev).slice(0, 300));
    else setCustomerAddressRaw(v.slice(0, 300));
  };
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [shopFeatures, setShopFeatures] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string>('pending');
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [isMagicListening, setIsMagicListening] = useState(false);

  useEffect(() => {
    if (pincode.length === 6) {
      const fetchAddress = async () => {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice?.[0];
            if (postOffice) {
              const areaInfo = `${postOffice.Name}, ${postOffice.District}, ${postOffice.State}`;
              setCustomerAddress(prev => {
                // TC-050 FIX: Prevent duplicate address append
                if (prev.includes(areaInfo)) return prev;
                return prev ? `${prev}, ${areaInfo}` : areaInfo;
              });
              toast.success(language === 'hi' ? 'पता मिल गया!' : 'Address found!');
              haptics.success();
            }
          }
        } finally {
          // No loading needed
        }
      };
      fetchAddress();
    }
  }, [pincode, language]);

  const handleMagicOrder = () => {
    if (!SpeechRecognition) {
      toast.error(language === 'hi' ? 'आपका ब्राउज़र वॉयस सपोर्ट नह करता' : 'Voice not supported on this browser');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'hi-IN';
    rec.onstart = () => setIsMagicListening(true);
    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const parsed = parseUnifiedTranscript(transcript);
      if (parsed.name) setCustomerName(parsed.name);
      if (parsed.address) setCustomerAddress(parsed.address);
      if (parsed.items.length > 0) setItems(parsed.items);
      if (parsed.name && parsed.items.length > 0) setStep(5);
    };
    rec.onend = () => setIsMagicListening(false);
    rec.start();
  };

  useEffect(() => {
    if (!shopId) return;

    const fetchMenu = async () => {
      // 1. Get Shop Profile and Features
      const { data: profileData, error: profileError } = await supabase
        .from('shops_profile')
        .select(`
          *,
          features:subscriptions(
            plans(features)
          )
        `)
        .eq('shop_id', shopId)
        .eq('subscriptions.status', 'active')
        .order('created_at', { foreignTable: 'subscriptions', ascending: false })
        .limit(1)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (profileData) {
        setProfile({
          id: profileData.id,
          shopId: profileData.shop_id,
          shopName: profileData.shop_name,
          ownerName: profileData.owner_name,
          phone: profileData.phone,
          address: profileData.address,
          upiId: profileData.upi_id,
          shopType: profileData.shop_type || 'retail',
          createdAt: profileData.created_at || new Date().toISOString()
        });

        // Extract features from subscription
        const subFeatures = profileData.features?.[0]?.plans?.features || {};
        setShopFeatures(subFeatures);

        // 2. Fetch Menu from Cloud
        const { data: items } = await supabase
          .from('menu_items')
          .select('*')
          .eq('shop_id', profileData.id)
          .eq('available', true);

        if (items) setMenuItems(items as any);
      }
    };

    fetchMenu();

    // 3. Subscribe to Menu Changes (Realtime)
    if (profile?.id) {
      const channel = supabase.channel(`menu-updates-${shopId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'menu_items',
          filter: `shop_id=eq.${profile.id}`
        }, () => {
          fetchMenu();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [shopId, profile?.id]);

  const canGoNext = () => {
    if (step === 1) return !!photo;
    if (step === 2) return !!customerName.trim() && customerPhone.length >= 10;
    if (step === 3) return !!customerAddress.trim() && pincode.length === 6;
    if (step === 4) return items.length > 0;
    return false;
  };

  const handleSubmitOrder = async (paymentStatus: 'cod' | 'upi') => {
    setSubmitting(true);
    try {
      // TC-030 FIX: Use a unified short ID for both customer and shopkeeper
      const shortId = `ORD-${Math.random().toString(36).toUpperCase().slice(2, 6)}`;
      const orderId = `order-${crypto.randomUUID()}`;

      // Prepare encrypted strings (Async)
      const encryptedName = await encrypt(customerName, shopId);
      const encryptedAddress = await encrypt(customerAddress, shopId);
      const encryptedPhone = customerPhone ? await encrypt(customerPhone, shopId) : null;

      // Upload to Cloud (Supabase) for real-time shopkeeper notification
      // TC-008 FIX: Temporary upload photo so shopkeeper can recognize customer
      // It will be deleted as soon as the order is completed/rejected.
      const { error: syncError } = await supabase.from('pending_orders').insert({
        id: orderId,
        shop_id: shopId,
        customer_name: encryptedName,
        customer_address: encryptedAddress,
        customer_phone: encryptedPhone,
        photo_data_url: photo, // Temporary sync for visibility
        short_id: shortId, // NEW: Human readable ID for both sides
        items,
        status: 'pending',
        type: locationType || undefined,
        no: locationNo || undefined,
        payment_status: paymentStatus,
        payment_received: false,
        created_at: new Date().toISOString()
      });

      if (!syncError) {
        setTrackedOrderId(orderId);
      } else {
        console.warn('[Sync] Supabase sync failed, using local fallback:', syncError);
      }

      // Keep local copy in Dexie 
      await db.pendingOrders.put({
        id: orderId,
        shopId,
        customerName: encryptedName,
        customerAddress: encryptedAddress,
        customerPhone: encryptedPhone || '',
        photoDataUrl: photo, 
        short_id: shortId, // Store locally too
        items,
        createdAt: Date.now(),
        status: 'pending',
        type: locationType || undefined,
        no: locationNo || undefined,
        paymentStatus,
        paymentReceived: false,
      });

      const total = items.reduce((acc, item) => acc + (item.price || 0), 0);
      setOrderSummary({ 
        customerName, 
        totalAmount: total, 
        itemsCount: items.length,
        shortId // Store the short ID for receipt sharing
      });
      setSubmitted(true);
      setShowSuccess(true);
      haptics.success();
      playSuccess();
    } catch (err) {
      console.error('[OrderFlow] Submit Error:', err);
      toast.error(t('customer.failure'));
    } finally {
      setSubmitting(false);
    }
};

const [prevStatus, setPrevStatus] = useState<string>('pending');

// Live Order Tracking Listener & Voice Notifications
useEffect(() => {
  if (!trackedOrderId) return;

  const channel = supabase.channel(`order-track-${trackedOrderId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'pending_orders',
      filter: `id=eq.${trackedOrderId}`
    }, (payload) => {
      if (payload.eventType === 'UPDATE') {
        const newStatus = payload.new.status;
        setLiveStatus(newStatus);

        // Customer Voice Notifications
        if (newStatus !== prevStatus) {
          if (newStatus === 'accepted') {
            speak(v => v.ORDER_ACCEPTED_CUSTOMER);
          } else if (newStatus === 'ready') {
            const shortId = `ORD-${trackedOrderId.slice(0, 4).toUpperCase()}`;
            speak(v => v.ORDER_READY_CUSTOMER(shortId));
          } else if (newStatus === 'completed') {
            speak(v => v.ORDER_COMPLETED_CUSTOMER);
          }
          setPrevStatus(newStatus);
        }
      } else if (payload.eventType === 'DELETE') {
        // Order was completed or rejected (removed from cloud)
        setLiveStatus('completed');
        if (prevStatus !== 'completed') {
          speak(v => v.ORDER_COMPLETED_CUSTOMER);
          setPrevStatus('completed');
        }
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [trackedOrderId, prevStatus, speak]);

const handleShareReceipt = async () => {
  if (!orderSummary) return;
  await generateReceiptCanvas({
    shopName: profile?.shopName || shopId,
    customerName,
    items,
    total: orderSummary.totalAmount,
    orderId: orderSummary.shortId, // Use the unified short ID
    date: new Date().toLocaleString()
  });
  const text = `*Order Receipt [${orderSummary.shortId}]*\n*Store:* ${profile?.shopName || shopId}\n*Total:* ₹${orderSummary.totalAmount}\n*Status:* Pending Approval`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
};

if (step === 0) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <GlassCard intensity="high" className="w-full max-w-sm p-8 text-center border-white/40 dark:border-white/10">
        <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl p-4 border border-white/20">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>

        <h1 className="text-3xl font-black tracking-tight mb-2">Order-<span className="text-brand-primary">Do</span></h1>

        {shopId ? (
          <div className="mb-6">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2">{t('customer.shopHeading')}</p>
            <div className="inline-block px-4 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20">
              <span className="text-brand-primary font-black uppercase italic tracking-tighter">{shopId}</span>
            </div>
            {locationType && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                {locationType === 'table' ? t('kds.table') : t('kds.counter')} {locationNo}
              </div>
            )}
          </div>
        ) : (
          <p className="text-red-500 mb-6 font-bold">{t('customer.shopNotFound')}</p>
        )}

        <p className="text-slate-500 text-sm font-medium mb-8 italic">{t('customer.instruction')}</p>

        <Button
          variant="primary"
          size="lg"
          className="w-full h-16 !rounded-2xl"
          onClick={() => { setStep(1); speak(language === 'hi' ? 'Chaliye shuru karte hain.' : 'Let’s start.'); }}
        >
          {t('customer.startOrder')}
          <ChevronRight className="ml-2" size={20} />
        </Button>

        <div className="mt-8 flex justify-center gap-4">
          <Link to="/privacy" className="text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-brand-primary transition-colors">Privacy</Link>
          <Link to="/terms" className="text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-brand-secondary transition-colors">Terms</Link>
        </div>
      </GlassCard>
    </div>
  );
}

return (
  <div className="min-h-screen flex flex-col">
    {/* Premium Navigation & Progress */}
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/20 dark:bg-slate-900/20 backdrop-blur-3xl border-b border-white/10 p-4">
      <div className="max-w-2xl mx-auto flex items-center gap-4">
        {!submitted && step > 1 && (
          <Button variant="ghost" size="sm" className="!p-0 w-10 h-10 rounded-full" onClick={() => setStep(s => s - 1)}>
            <ArrowLeft size={18} />
          </Button>
        )}

        {/* Liquid Progress Dots */}
        <div className="flex-1 flex justify-between items-center relative gap-2">
          {getSteps(t).map((s, idx) => (
            <div key={s.id} className="flex-1 flex items-center gap-2">
              <div className={`
                  w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all duration-500
                  ${step >= s.id ? 'bg-brand-primary text-white shadow-glow-green scale-110' : 'bg-white/40 dark:bg-slate-800/40 text-slate-400 border border-white/10'}
                `}>
                {step > s.id ? '✓' : s.id}
              </div>
              {idx < getSteps(t).length - 1 && (
                <div className={`flex-1 h-[2px] rounded-full ${step > s.id ? 'bg-brand-primary' : 'bg-slate-200 dark:bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="!p-0 w-10 h-10 rounded-full" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
        </div>
      </div>
    </div>

    {/* Main Flow Area */}
    <div className="flex-1 pt-24 pb-32 px-6">
      <div className="max-w-md mx-auto h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="h-full"
          >
            <GlassCard intensity="medium" className="p-1 overflow-hidden">
              {/* Step Header */}
              <div className="p-6 pb-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-2xl ${step === 1 ? 'bg-blue-500/10 text-blue-500' : step === 2 ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-brand-primary/10 text-brand-primary'}`}>
                    {getSteps(t)[step - 1].icon && <IconComponent icon={getSteps(t)[step - 1].icon} />}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t(`customer.steps.${['photo', 'name', 'address', 'items', 'preview'][step - 1]}`)}</h4>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{t(`customer.step${step}Title`)}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-6">
                {step === 1 && <CameraCapture shopId={shopId} onCapture={setPhoto} />}
                {step === 2 && (
                  <div className="space-y-6">
                    <VoiceNameInput onNameSet={setCustomerName} />
                    <Input
                      label="Phone Number"
                      placeholder="9876543210"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      icon={<span className="text-[10px] font-black">+91</span>}
                    />
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-6">
                    <Input
                      label="Pin Code"
                      placeholder="110001"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-xl tracking-[0.5em] font-black"
                    />
                    <VoiceAddressInput onAddressSet={setCustomerAddress} initialValue={customerAddress} />
                  </div>
                )}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                      {menuItems.length > 0 ? (
                        menuItems.map(mi => (
                          <button
                            key={mi.id}
                            onClick={() => setItems([...items, { name: mi.name, quantity: '1', price: mi.price }])}
                            className="px-3 py-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl text-xs font-bold hover:bg-brand-primary hover:text-white transition-all active:scale-95"
                          >
                            {mi.name} · ₹{mi.price}
                          </button>
                        ))
                      ) : (
                        <div className="w-full py-6 px-4 bg-amber-500/5 border border-dashed border-amber-500/20 rounded-2xl text-center">
                           <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
                             {language === 'hi' ? 'मेनू खाली है' : 'Menu is Empty'}
                           </p>
                           <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                             {language === 'hi' 
                               ? 'मेनू अभी अपडेट हो रहा है! आप नीचे दिए गए माइक बटन से बोल कर अपना ऑर्डर दे सकते हैं।' 
                               : 'Menu is being updated! You can still use the magic microphone below to place your order.'}
                           </p>
                        </div>
                      )}
                    </div>
                    <VoiceItemList items={items} onItemsChange={setItems} />
                  </div>
                )}
                {step === 5 && (
                  <OrderPreview
                    photo={photo}
                    customerName={customerName}
                    customerAddress={customerAddress}
                    items={items}
                    shopId={shopId}
                    shopName={profile?.shopName || shopId}
                    upiId={profile?.upiId}
                    onSubmit={handleSubmitOrder}
                    submitting={submitting}
                    submitted={submitted}
                  />
                )}
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>

    {/* Floating Bottom Navigation */}
    {step < 5 && !submitted && (
      <div className="fixed bottom-0 left-0 right-0 p-6 z-40 bg-gradient-to-t from-white dark:from-slate-950 to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            disabled={!canGoNext()}
            onClick={() => setStep(s => s + 1)}
            className="w-full h-16 shadow-glow-green"
            size="lg"
          >
            {t('common.next')}
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>
      </div>
    )}

    {/* Magic AI MIC Orb */}
    {!submitted && step >= 1 && step < 5 && (
      <div className="fixed bottom-28 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={handleMagicOrder}
          className={`
              relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl overflow-hidden
              ${isMagicListening ? 'bg-red-500' : 'bg-slate-950'}
            `}
        >
          {isMagicListening ? (
            <motion.div animate={{ scale: [1, 2, 1], opacity: [0.5, 0.2, 0.5] }} transition={{ repeat: Infinity }} className="absolute inset-0 bg-red-400 rounded-full" />
          ) : (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-primary opacity-40 blur-sm" />
          )}
          <Mic className="text-white relative z-10" size={24} />
        </motion.button>

        <AnimatePresence>
          {!isMagicListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute right-20 top-1/2 -translate-y-1/2 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl whitespace-nowrap shadow-xl border border-white/10"
            >
              AI Magic Order
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )}

    {submitted && <SuccessModal
      isOpen={showSuccess}
      onClose={() => navigate('/')}
      shopId={shopId}
      shopUUID={profile?.id}
      orderId={trackedOrderId || ''}
      orderSummary={orderSummary}
      onShareReceipt={handleShareReceipt}
      orderStatus={liveStatus}
      feedbackEnabled={shopFeatures.magic_feedback}
    />}
    {submitted && <Confetti />}
  </div>
);
}

function IconComponent({ icon: Icon }: { icon: any }) {
  return <Icon size={24} />;
}
