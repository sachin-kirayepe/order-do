import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PackageOpen, User, MapPin, ImageIcon, Banknote, QrCode, AlertCircle } from 'lucide-react';
import type { OrderItem } from '../../db/dexie';
import Button from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useAntiCapture } from '../../hooks/useAntiCapture';
import ProtectionOverlay from '../ui/ProtectionOverlay';
import SecureCanvas from '../ui/SecureCanvas';
import UPIQRCode from './UPIQRCode';

interface OrderPreviewProps {
  photo: string;
  customerName: string;
  customerAddress: string;
  items: OrderItem[];
  shopId: string;
  shopName: string;
  upiId?: string;
  onSubmit: (paymentStatus: 'cod' | 'upi', utr?: string) => void;
  submitting: boolean;
  submitted: boolean;
  disableCOD?: boolean;
}

export default function OrderPreview({
  photo, customerName, customerAddress, items, shopName, upiId, onSubmit, submitting, submitted, disableCOD
}: OrderPreviewProps) {
  const { t, language } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>(disableCOD ? 'upi' : 'cod');
  const [paymentUtr, setPaymentUtr] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const captchaProblem = useMemo(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { a, b, result: a + b };
  }, []);
  const { isBlocked } = useAntiCapture(!submitted);

  const { totalAmount, hasUnpricedItems } = useMemo(() => {
    let sum = 0;
    let missing = false;
    items.forEach(item => {
      if (item.price) sum += item.price;
      else missing = true;
    });
    // TC-055 FIX: Round total to 2 decimal places
    const roundedTotal = Math.round(sum * 100) / 100;
    return { totalAmount: roundedTotal, hasUnpricedItems: missing };
  }, [items]);

  const canSubmit = !!photo && !!customerName && !!customerAddress && items.length > 0 && parseInt(captchaAnswer) === captchaProblem.result;


  return (
    <div className="flex flex-col gap-5 relative">
      <ProtectionOverlay isVisible={isBlocked} />
      
      <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white text-center lowercase tracking-tighter italic">
        {t('customer.orderReview')}
      </h2>

      {/* Photo */}
      <div className="rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 relative shadow-sm">
        {photo ? (
          <SecureCanvas 
            image={photo} 
            width={640} 
            height={360} 
            tagline="Order Proof // Secure"
            className="border-none"
          />
        ) : (
          <div className="w-full h-24 md:h-32 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-2 text-slate-400">
            <ImageIcon size={28} className="md:w-8 md:h-8" />
            <span className="text-xs md:text-sm">{t('customer.photoMissing')}</span>
          </div>
        )}
        {!photo && (
          <div className="absolute inset-0 bg-red-500/5 border-2 border-dashed border-red-300 rounded-3xl flex items-center justify-center">
            <span className="text-red-500 text-xs font-bold uppercase tracking-widest">{t('customer.photoRequired')}</span>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800/50 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-kirana-green/10 rounded-xl text-kirana-green">
            <User size={18} />
          </div>
          {customerName ? (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('customer.steps.name')}</p>
              <SecureCanvas content={customerName} width={300} height={32} fontSize={15} className="border-none bg-transparent" />
            </div>
          ) : (
            <p className="text-sm text-red-500 font-bold">⚠️ {t('customer.nameRequired')}</p>
          )}
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-800/50 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-kirana-orange/10 rounded-xl text-kirana-orange">
            <MapPin size={18} />
          </div>
          {customerAddress ? (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('setup.address')}</p>
              <SecureCanvas content={customerAddress} width={300} height={32} fontSize={14} className="border-none bg-transparent" />
            </div>
          ) : (
            <p className="text-sm text-red-500 font-bold">⚠️ Address required</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 overflow-hidden">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-2">
            <PackageOpen size={14} className="text-kirana-orange" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">{t('customer.steps.items')} ({items.length})</span>
          </div>
          <div className="p-2">
            {items.length > 0 ? (
              <SecureCanvas 
                content={items.map(it => `${it.name} - ${it.quantity}`)} 
                width={380} 
                height={Math.max(80, items.length * 28)} 
                fontSize={14}
                className="border-none bg-transparent"
              />
            ) : (
              <div className="px-4 py-4 text-sm text-red-500 font-bold text-center italic">{t('customer.itemsRequired')}</div>
            )}
          </div>
          
          {/* Total Row */}
          {totalAmount > 0 && (
            <div className="px-3 md:px-4 py-2.5 md:py-3 bg-kirana-green/5 dark:bg-kirana-green/10 flex justify-between items-center border-t border-kirana-green/20">
              <span className="text-xs md:text-sm font-black text-slate-500 uppercase tracking-widest">{t('customer.totalAmount')}</span>
              <span className="text-lg md:text-xl font-black text-kirana-green">₹{totalAmount}</span>
            </div>
          )}
        </div>
      </div>

      {hasUnpricedItems && (
        <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-200 dark:border-amber-500/20">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 leading-tight">
            {t('customer.finalPriceNote')}
          </p>
        </div>
      )}

      {/* Payment Selection */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Payment Method</h3>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <button
            onClick={() => !disableCOD && setPaymentMethod('cod')}
            disabled={disableCOD}
            className={`flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all duration-300 ${
              paymentMethod === 'cod' 
                ? 'border-kirana-green bg-kirana-green/10 shadow-lg shadow-kirana-green/5' 
                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-400 opacity-60'
            } ${disableCOD ? 'cursor-not-allowed grayscale' : ''}`}
          >
            <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl ${paymentMethod === 'cod' ? 'bg-kirana-green text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <Banknote size={20} className="md:w-6 md:h-6" />
            </div>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-tighter italic">
              {disableCOD ? 'COD Blocked' : t('customer.payCash')}
            </span>
          </button>

          {upiId ? (
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all duration-300 ${
                paymentMethod === 'upi' 
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5' 
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-400 opacity-60'
              }`}
            >
              <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl ${paymentMethod === 'upi' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <QrCode size={20} className="md:w-6 md:h-6" />
              </div>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-tighter italic">{t('customer.payUPI')}</span>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 opacity-30">
               <QrCode size={20} className="md:w-6 md:h-6 text-slate-300 mb-1" />
               <span className="text-[8px] md:text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">UPI Unavailable</span>
            </div>
          )}
        </div>

        <AnimatePresence>
          {paymentMethod === 'upi' && upiId && totalAmount > 0 && (
            <div className="space-y-4">
              <UPIQRCode upiId={upiId} shopName={shopName} amount={totalAmount} />
              
              <div className="bg-blue-50 dark:bg-blue-500/5 p-4 rounded-2xl border border-blue-200 dark:border-blue-500/20 space-y-3">
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={12} /> Verification Required
                </p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter 12-digit UTR / Ref No."
                    value={paymentUtr}
                    onChange={(e) => setPaymentUtr(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                    className="w-full h-12 px-4 bg-white dark:bg-slate-950 border-2 border-blue-200 dark:border-blue-500/20 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
                  Payment verification takes 10-30 seconds after entering UTR. Please do not close the app.
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* ANTI-SPAM: Math Captcha */}
        {!submitted && (
          <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 md:space-y-3">
             <div className="flex items-center justify-between">
                <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Verify You Are Human</p>
                <span className="text-[10px] md:text-xs font-black text-brand-primary bg-brand-primary/10 px-1.5 md:px-2 py-0.5 rounded-md">SPAM GUARD</span>
             </div>
             <div className="flex items-center gap-3 md:gap-4">
                <div className="flex-1 h-10 md:h-12 flex items-center justify-center bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-lg md:rounded-xl text-base md:text-lg font-black tracking-widest italic">
                  {captchaProblem.a} + {captchaProblem.b} = ?
                </div>
                <input 
                  type="number"
                  placeholder="Ans"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="w-20 md:w-24 h-10 md:h-12 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-lg md:rounded-xl text-center text-base md:text-lg font-black outline-none focus:border-brand-primary transition-all"
                />
             </div>
          </div>
        )}

        {disableCOD && (
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
             <p className="text-[9px] font-black text-red-600 uppercase tracking-widest text-center italic">
                {language === 'hi' ? 'Pichle galat vyavahar ke karan COD band hai.' : 'COD disabled due to previous policy violations.'}
             </p>
          </div>
        )}
      </div>

      <Button
        onClick={() => onSubmit(paymentMethod, paymentUtr)}
        disabled={!canSubmit || (paymentMethod === 'upi' && paymentUtr.length < 12)}
        isLoading={submitting}
        className="w-full py-3 md:py-4 text-base md:text-lg font-black italic tracking-tighter uppercase !rounded-xl md:!rounded-2xl"
      >
        {t('customer.submitOrder')} ✓
      </Button>

      {!canSubmit && (
        <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest px-8">
          {t('customer.previewFooter')}
        </p>
      )}
    </div>
  );
}
