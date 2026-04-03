import { useState, useMemo } from 'react';
import type { PendingOrder, OrderItem } from '../../db/dexie';
import { X, User, CheckCircle, XCircle, Volume2, IndianRupee, Banknote, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { announceOrder } from '../../utils/announce';
import { decrypt } from '../../utils/encryption';
import { useLanguage } from '../../context/LanguageContext';
import { useAntiCapture } from '../../hooks/useAntiCapture';
import SecureCanvas from '../ui/SecureCanvas';
import Button from '../ui/Button';

interface OrderModalProps {
  order: PendingOrder;
  onClose: () => void;
  onDone: (order: PendingOrder, pricedItems: OrderItem[], total: number, paymentReceived: boolean) => void;
  onReject: (order: PendingOrder) => void;
}

export default function OrderModal({ order, onClose, onDone, onReject }: OrderModalProps) {
  const customerName = decrypt(order.customerName);
  const customerAddress = decrypt(order.customerAddress);
  // Local copy of items with prices
  const [pricedItems, setPricedItems] = useState<OrderItem[]>(
    order.items.map((i) => ({ ...i, price: i.price ?? 0 }))
  );
  const [paymentReceived, setPaymentReceived] = useState(order.paymentReceived || false);
  const [processing, setProcessing] = useState(false);
  const { t, language } = useLanguage();
  useAntiCapture(true);

  const total = useMemo(
    () => pricedItems.reduce((sum, i) => sum + (i.price || 0), 0),
    [pricedItems]
  );

  const updatePrice = (idx: number, price: number) => {
    setPricedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, price } : item))
    );
  };

  const handleDone = async () => {
    setProcessing(true);
    await onDone(order, pricedItems, total, paymentReceived);
    setProcessing(false);
  };

  const handleReject = async () => {
    setProcessing(true);
    await onReject(order);
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('orders.title')}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => announceOrder(customerName, order.items, order.type, order.no)}
              className="p-2 rounded-lg bg-kirana-orange/10 text-kirana-orange hover:bg-kirana-orange hover:text-white transition-all"
              title={language === 'hi' ? 'बोलकर सुनें' : 'Listen'}
            >
              <Volume2 size={18} />
            </button>
            {order.customerPhone && (
              <button
                onClick={() => {
                  const message = language === 'hi' 
                    ? `नमस्ते ${customerName}, आपका Order-Do से किया गया ऑर्डर तैयार है! कलेक्ट कर लें। कुल: ₹${total.toFixed(0)}`
                    : `Hello ${customerName}, your order from Order-Do is ready for pickup! Total: ₹${total.toFixed(0)}`;
                  window.open(`https://wa.me/91${order.customerPhone}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all"
                title="Notify on WhatsApp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400">
              < X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Customer Info */}
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 shrink-0">
              {order.photoDataUrl ? (
                <SecureCanvas 
                  image={order.photoDataUrl} 
                  width={200} 
                  height={200} 
                  className="w-full h-full border-none"
                  tagline="Secure"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={32} /></div>
              )}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{t('orders.customer')}</p>
              <div className="flex items-center gap-2">
                 <SecureCanvas content={customerName} width={220} height={32} fontSize={18} className="border-none bg-transparent" />
                 {order.type && order.no && (
                   <span className="text-[10px] font-black uppercase text-kirana-orange bg-kirana-orange/10 px-2 py-0.5 rounded-md border border-kirana-orange/20">
                     {order.type === 'table' ? t('kds.table') : t('kds.counter')} {order.no}
                   </span>
                 )}
              </div>
              <SecureCanvas content={customerAddress} width={220} height={24} fontSize={12} className="border-none bg-transparent" />
              <p className="text-[9px] text-slate-300 mt-0.5 uppercase tracking-wider font-bold italic">
                {new Date(order.createdAt).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          {/* Payment Status Management */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
             <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('customer.paymentStatus')}</span>
                  <div className="flex items-center gap-2 mt-1">
                    {order.paymentStatus === 'upi' ? (
                      <div className="flex items-center gap-1.5 text-blue-500 font-bold text-sm">
                        <QrCode size={16} /> {t('customer.payUPI')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm">
                        <Banknote size={16} /> {t('customer.payCash')}
                      </div>
                    )}
                  </div>
                </div>

                <div 
                  onClick={() => setPaymentReceived(!paymentReceived)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentReceived 
                      ? 'bg-kirana-green border-kirana-green text-white shadow-lg shadow-kirana-green/20' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  <CheckCircle2 size={18} />
                  <span className="text-xs font-black uppercase tracking-tighter italic">
                    {paymentReceived ? t('customer.paymentReceived') : 'MARK AS PAID'}
                  </span>
                </div>
             </div>
             {!paymentReceived && (
               <div className="flex gap-2 items-center text-[10px] font-bold text-slate-400 italic">
                  <AlertCircle size={12} className="text-slate-300" />
                  Please confirm payment before completing the order.
               </div>
             )}
          </div>

          {/* Item List with Price Inputs */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_90px] text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900 px-4 py-2.5">
              <span>{t('orders.items')}</span>
              <span>{t('orders.quantity')}</span>
              <span className="text-right">{t('orders.price')} (₹)</span>
            </div>
            {pricedItems.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_80px_90px] items-center px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <div className="flex items-center">
                  <SecureCanvas content={item.name} width={180} height={24} fontSize={14} className="border-none bg-transparent" />
                </div>
                <span className="text-xs text-slate-400 font-black">{item.quantity}</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={item.price || ''}
                    onChange={(e) => updatePrice(idx, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full text-right text-sm font-black font-mono pl-5 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:border-kirana-green focus:outline-none focus:ring-1 focus:ring-kirana-green/30"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-kirana-green/5 dark:bg-kirana-green/10 px-5 py-4 rounded-2xl border border-kirana-green/20">
            <span className="flex items-center gap-2 font-black text-slate-700 dark:text-white uppercase tracking-widest text-sm">
              <IndianRupee size={18} className="text-kirana-green" /> {t('orders.total')}
            </span>
            <span className="text-2xl font-black text-kirana-green font-mono">₹{total.toFixed(0)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <button
            onClick={handleReject}
            disabled={processing}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-red-200 dark:border-red-500/30 text-red-500 font-black uppercase tracking-tighter italic hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <XCircle size={18} /> {t('common.reject')}
          </button>
          <Button
            onClick={handleDone}
            isLoading={processing}
            className="flex-1 py-3 text-base font-black italic uppercase tracking-tighter gap-2"
          >
            <CheckCircle size={18} /> {t('common.done')} — ₹{total.toFixed(0)}
          </Button>
        </div>
      </div>
    </div>
  );
}
