import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Camera, User, MapPin, ShoppingBasket, ClipboardCheck, ArrowLeft, ArrowRight, Sun, Moon, Sparkles, Mic } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import CameraCapture from '../../components/customer/CameraCapture';
import VoiceNameInput from '../../components/customer/VoiceNameInput';
import VoiceAddressInput from '../../components/customer/VoiceAddressInput';
import VoiceItemList from '../../components/customer/VoiceItemList';
import OrderPreview from '../../components/customer/OrderPreview';
import type { OrderItem, MenuItem } from '../../db/dexie';
import db from '../../db/dexie';
import { encrypt } from '../../utils/encryption';
import { parseUnifiedTranscript } from '../../utils/unifiedParser';
import haptics from '../../utils/haptics';
import useSound from '../../hooks/useSound';
import Confetti from '../../components/ui/Confetti';
import SuccessModal from '../../components/ui/SuccessModal';
import { generateReceiptCanvas } from '../../utils/receiptGenerator';
import { useTalkingCharacter } from '../../context/TalkingCharacterContext';

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const TOTAL_STEPS = 5;

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
  const { speak, setIsVisible } = useTalkingCharacter();
  const shopId = searchParams.get('shop') || '';
  const locationType = searchParams.get('type') as 'counter' | 'table' | null;
  const locationNo = searchParams.get('no') || '';
  
  const [step, setStep] = useState(0); // 0 = landing, 1-5 = flow steps
  const [photo, setPhoto] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [shopProfile, setShopProfile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [isMagicListening, setIsMagicListening] = useState(false);

  // Pin Code Fetcher
  useEffect(() => {
    if (pincode.length === 6) {
      const fetchAddress = async () => {
        setIsPincodeLoading(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice?.[0];
            if (postOffice) {
              const areaInfo = `${postOffice.Name}, ${postOffice.District}, ${postOffice.State}`;
              setCustomerAddress(prev => prev ? `${prev}, ${areaInfo}` : areaInfo);
              toast.success(language === 'hi' ? 'पता मिल गया!' : 'Address found!');
              haptics.success();
            }
          } else {
            toast.error(language === 'hi' ? 'गलत पिन कोड' : 'Invalid Pin Code');
          }
        } catch (err) {
          console.error('Pincode fetch error:', err);
        } finally {
          setIsPincodeLoading(false);
        }
      };
      fetchAddress();
    }
  }, [pincode, language]);

  const handleMagicOrder = () => {
    if (!SpeechRecognition) {
      toast.error(t('customer.voiceNotSupported'));
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'hi-IN';
    rec.interimResults = false;
    rec.onstart = () => setIsMagicListening(true);
    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const parsed = parseUnifiedTranscript(transcript);
      
      if (parsed.name) setCustomerName(parsed.name);
      if (parsed.address) setCustomerAddress(parsed.address);
      if (parsed.items.length > 0) setItems(parsed.items);

      if (parsed.name && parsed.items.length > 0) {
        toast.success(language === 'hi' ? 'शानदार! हमने आपका ऑर्डर समझ लिया है।' : 'Great! We understood your order.');
        setStep(5); // Skip to preview
      } else {
        toast.info(language === 'hi' ? 'कुछ जानकारी रह गई है, कृपया चेक करें' : 'Some info missing, please check');
        if (step === 1) setStep(2);
      }
    };
    rec.onerror = () => {
      toast.error(t('customer.voiceTryAgain'));
      setIsMagicListening(false);
    };
    rec.onend = () => setIsMagicListening(false);
    rec.start();
  };

  // Load shop profile & menu items
  useEffect(() => {
    if (shopId) {
      db.shopProfile.where('shopId').equals(shopId).first().then(setShopProfile);
      db.menuItems.where('shopId').equals(shopId).toArray().then(setMenuItems);
    }
  }, [shopId]);

  const canGoNext = () => {
    if (step === 1) return !!photo;
    if (step === 2) return !!customerName.trim() && customerPhone.length >= 10;
    if (step === 3) return !!customerAddress.trim();
    if (step === 4) return items.length > 0;
    return false;
  };

  const handleSubmitOrder = async (paymentStatus: 'cod' | 'upi') => {
    setSubmitting(true);
    try {
      await db.pendingOrders.put({
        id: `order-${Date.now()}`,
        shopId,
        customerName: encrypt(customerName),
        customerAddress: encrypt(customerAddress),
        customerPhone,
        photoDataUrl: photo,
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
        itemsCount: items.length
      });
      setSubmitted(true);
      setShowSuccess(true);
      haptics.success();
      playSuccess();
    } catch (err) {
      console.error('Order save error:', err);
      toast.error(t('customer.failure'));
    }
    setSubmitting(false);
  };

  const handleShareReceipt = async () => {
    if (!orderSummary) return;
    try {
      await generateReceiptCanvas({
        shopName: shopProfile?.shopName || shopId,
        customerName,
        items,
        total: orderSummary.totalAmount,
        orderId: `ORD-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleString()
      });

      const text = `*Order Receipt from ${shopProfile?.shopName || shopId}*\n\n` +
        `*Customer:* ${customerName}\n` +
        `*Items:*\n${items.map(i => `- ${i.name} (x${i.quantity})`).join('\n')}\n\n` +
        `*Total:* ₹${orderSummary.totalAmount}\n\n` +
        `_Order ID: ORD-${Date.now().toString().slice(-6)}_`;
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
      toast.success('Sharing receipt...');
    } catch (err) {
      console.error('Receipt error:', err);
      toast.error('Failed to generate receipt');
    }
  };

  // ── Landing screen ─────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
        {/* Blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-kirana-green/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-kirana-orange/15 rounded-full blur-3xl" />

      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-25 dark:opacity-15 pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: 'url("/bg-shops.png")' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-sm w-full">


        <div className="w-24 h-24 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md flex items-center justify-center p-4 shadow-2xl border border-white/20">
          <img src="/logo.png" alt="Order-Do Logo" className="w-full h-full object-contain drop-shadow-md" />
        </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Order-<span className="text-kirana-green">Do</span></h1>
            {shopId ? (
              <div className="mt-2 space-y-1">
                <p className="text-slate-500 text-sm">
                  {t('customer.shopHeading')} <span className="font-mono font-semibold text-kirana-orange">{shopId}</span>
                </p>
                {locationType && locationNo && (
                   <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                     <div className="w-1.5 h-1.5 rounded-full bg-kirana-green animate-pulse" />
                     {locationType === 'table' ? t('kds.table') : t('kds.counter')} {locationNo}
                   </div>
                )}
              </div>
            ) : (
              <p className="text-red-400 mt-2 text-sm">{t('customer.shopNotFound')}</p>
            )}
            <p className="text-slate-400 mt-3 text-sm font-medium">{t('customer.instruction')}</p>
          </div>

          {shopId && (
            <div className="w-full space-y-3">
              <button
                onClick={() => {
                   setStep(1);
                   setIsVisible(true);
                   speak(language === 'hi' ? 'Chaliye shuru karte hain. Pehle apni ek saaf photo lijiye.' : 'Let’s start. First, take a clear photo of yourself.');
                }}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-kirana-green to-emerald-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:opacity-90 active:scale-98 transition-all"
              >
                {t('customer.startOrder')}
              </button>
              <p className="text-xs text-slate-400">
                {t('customer.stepTime')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Progress Indicator ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Top bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        {!submitted && step > 1 && (
          <button onClick={() => setStep(s => s - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex-1 flex items-center gap-2">
          {getSteps(t).map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-1.5 flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 transition-all ${
                  done ? 'bg-kirana-green text-white' : active ? 'bg-kirana-orange text-white ring-4 ring-kirana-orange/20 shadow-lg shadow-kirana-orange/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }`}>
                  {done ? '✓' : <Icon size={13} />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${active ? 'text-kirana-orange' : done ? 'text-kirana-green' : 'text-slate-400'}`}>{s.label}</span>
                {i < getSteps(t).length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full ${done ? 'bg-kirana-green' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-kirana-orange transition-all active:scale-90"
            title={theme === 'light' ? t('dashboard.darkMode') : t('dashboard.lightMode')}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <span className="text-xs text-slate-400 font-mono shrink-0 font-bold">{step}/{TOTAL_STEPS}</span>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="max-w-sm mx-auto h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex items-start gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-xl bg-kirana-green/10 flex items-center justify-center shrink-0">
                      <Camera size={24} className="text-kirana-green" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('customer.step1Title')}</h2>
                      <p className="text-xs text-slate-500 mt-1">{t('customer.step1Desc')}</p>
                    </div>
                  </div>
                  <CameraCapture shopId={shopId} onCapture={setPhoto} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-xl bg-kirana-orange/10 flex items-center justify-center shrink-0">
                      <User size={24} className="text-kirana-orange" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('customer.step2Title')}</h2>
                      <p className="text-xs text-slate-500 mt-1">{t('customer.step2Desc')}</p>
                    </div>
                  </div>
                  <VoiceNameInput onNameSet={setCustomerName} />
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Mobile Number</p>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">+91</div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-900 focus:border-kirana-green outline-none transition-all font-bold tracking-widest"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">For order updates on WhatsApp</p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <MapPin size={24} className="text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('customer.step3Title')}</h2>
                      <p className="text-xs text-slate-500 mt-1">{t('customer.step3Desc')}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Pin Code (6 digits)</p>
                    <div className="relative">
                      <input
                        type="tel"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="110001"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-900 focus:border-kirana-green outline-none transition-all font-bold tracking-widest text-center text-lg"
                      />
                      {isPincodeLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-kirana-green border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  <VoiceAddressInput onAddressSet={setCustomerAddress} initialValue={customerAddress} />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <ShoppingBasket size={24} className="text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('customer.step4Title')}</h2>
                      <p className="text-xs text-slate-500 mt-1">{t('customer.step4Desc')}</p>
                    </div>
                  </div>

                  {menuItems.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <ShoppingBasket size={14} className="text-kirana-green" />
                        {t('customer.addItemMenu')}
                      </h3>
                      
                      <div className="space-y-4">
                        {Object.entries(
                          menuItems.reduce((acc, item) => {
                            const cat = item.category || 'Other';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(item);
                            return acc;
                          }, {} as Record<string, MenuItem[]>)
                        ).map(([category, itemsInCategory]) => (
                          <div key={category} className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 border-l-2 border-kirana-green/30 ml-1">
                              {category}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {itemsInCategory.map((mi) => (
                                <button
                                  key={mi.id}
                                  onClick={() => {
                                    const existing = items.find(i => i.name === mi.name);
                                    if (existing) {
                                      const qty = parseInt(existing.quantity) || 1;
                                      setItems(items.map(i => i.name === mi.name ? { ...i, quantity: (qty + 1).toString() } : i));
                                    } else {
                                      setItems([...items, { name: mi.name, quantity: '1', price: mi.price }]);
                                    }
                                    toast.success(`${mi.name} ${t('common.done') || 'added'}`);
                                  }}
                                  className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-kirana-green transition-all active:scale-95 flex items-center gap-2"
                                >
                                  <span>{mi.name}</span>
                                  <span className="text-kirana-green font-bold text-xs">₹{mi.price}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <VoiceItemList items={items} onItemsChange={setItems} />
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-xl bg-kirana-green/10 flex items-center justify-center shrink-0">
                      <ClipboardCheck size={24} className="text-kirana-green" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('customer.step5Title')}</h2>
                      <p className="text-xs text-slate-500 mt-1">{t('customer.step5Desc')}</p>
                    </div>
                  </div>
                  <OrderPreview
                    photo={photo}
                    customerName={customerName}
                    customerAddress={customerAddress}
                    items={items}
                    shopId={shopId}
                    shopName={shopProfile?.shopName || shopId}
                    upiId={shopProfile?.upiId}
                    onSubmit={handleSubmitOrder}
                    submitting={submitting}
                    submitted={submitted}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      {step < 5 && !submitted && (
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 sticky bottom-0 safe-area-pb">
          <motion.button
            whileTap={{ scale: 0.98 }}
            animate={canGoNext() ? { y: [0, -4, 0] } : {}}
            transition={{ repeat: canGoNext() ? Infinity : 0, duration: 2 }}
            onClick={() => {
              const nextStep = step + 1;
              setStep(nextStep);
              haptics.light();
              
              if (nextStep === 2) {
                speak(
                  language === 'hi' 
                    ? 'अरे वाह! शानदार फोटो। अब कृपया अपना नाम और मोबाइल नंबर बताइये।' 
                    : 'Great photo! Now, please tell me your name and mobile number.'
                , 'explaining');
              }
              if (nextStep === 3) {
                speak(
                  language === 'hi' 
                    ? 'शुक्रिया! अब अपना पता और पिन कोड दीजिये ताकि हम डिलीवरी कर सकें।' 
                    : 'Thank you! Now, provide your address and pin code so we can deliver.'
                , 'pointing');
              }
              if (nextStep === 4) {
                speak(
                  language === 'hi' 
                    ? 'बस थोड़ा सा और! अब अपनी पसंद की चीज़ें चुनिए। आप बोल कर भी बता सकते हैं।' 
                    : 'Almost there! Now pick your favorite items. You can also say them out loud.'
                , 'explaining');
              }
              if (nextStep === 5) {
                speak(
                  language === 'hi' 
                    ? 'कृपया अपने ऑर्डर की जांच करें। अगर सब ठीक है, तो कंफर्म करें!' 
                    : 'Please review your order. If everything looks good, go ahead and confirm!'
                , 'success');
              }
            }}
            disabled={!canGoNext()}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all ${
              canGoNext()
                ? 'bg-kirana-green text-white shadow-md hover:bg-kirana-dark active:scale-[0.98]'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {t('common.next')} <ArrowRight size={20} />
          </motion.button>
        </div>
      )}

      {/* AI MAGIC MIC - Unified Order Button */}
      {!submitted && step >= 1 && step < 5 && (
        <div className="fixed bottom-24 right-4 z-40">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleMagicOrder}
            className={`flex items-center justify-center gap-2 p-4 rounded-full shadow-2xl transition-all ${
              isMagicListening ? 'bg-red-500 animate-pulse' : 'bg-slate-800 dark:bg-kirana-green'
            } text-white`}
          >
            {isMagicListening ? <Mic size={24} /> : <Sparkles size={24} />}
            <span className="text-xs font-bold uppercase tracking-widest hidden md:block">
              {isMagicListening ? 'Listening...' : 'Magic Mic'}
            </span>
          </motion.button>
          {!isMagicListening && (
            <div className="absolute -top-12 -left-32 bg-white dark:bg-slate-800 text-[10px] font-black px-3 py-2 rounded-2xl shadow-xl border border-kirana-green/20 text-kirana-green whitespace-nowrap animate-bounce">
              {language === 'hi' ? 'एक साथ सब बोलें (AI)' : 'Order everything at once!'}
            </div>
          )}
        </div>
      )}

      {submitted && (
        <div className="p-4">
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 text-center text-sm text-kirana-green font-bold hover:underline bg-kirana-green/5 dark:bg-kirana-green/10 rounded-2xl"
          >
            {t('common.home')}
          </button>
        </div>
      )}
      {submitted && <Confetti />}
      
      <SuccessModal 
        isOpen={showSuccess} 
        onClose={() => {
          setShowSuccess(false);
          navigate('/');
        }} 
        shopId={shopId} 
        orderSummary={orderSummary}
        onShareReceipt={handleShareReceipt}
      />
    </div>
  );
}
