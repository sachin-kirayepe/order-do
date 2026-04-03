import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Home, Share2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Confetti from './Confetti';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  orderSummary?: {
    customerName: string;
    totalAmount: number;
    itemsCount: number;
  };
  onShareReceipt?: () => void;
}

export default function SuccessModal({ isOpen, onClose, shopId, orderSummary, onShareReceipt }: SuccessModalProps) {
  const { t, language } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
          >
            <Confetti />
            
            <div className="p-8 flex flex-col items-center text-center">
              {/* Success Icon Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-20 h-20 bg-kirana-green/10 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle size={48} className="text-kirana-green" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                  {t('customer.orderSuccessTitle')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm px-4">
                  {t('customer.orderSuccessDesc').replace('[shopId]', shopId)}
                </p>
              </motion.div>

              {/* Order Summary Card */}
              {orderSummary && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="w-full mt-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/50"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{orderSummary.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Items</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{orderSummary.itemsCount} {t('report.items')}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-kirana-green">Total Paid</span>
                    <span className="text-lg font-black text-kirana-green">₹{orderSummary.totalAmount}</span>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full mt-8 space-y-3"
              >
                <button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-kirana-green to-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-kirana-green/20 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-lg"
                >
                  <Home size={20} />
                  {t('common.home')}
                </button>

                {onShareReceipt && (
                  <button
                    onClick={onShareReceipt}
                    className="w-full bg-white dark:bg-slate-700/50 text-kirana-green border-2 border-kirana-green/20 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-kirana-green/5 active:scale-95 transition-all text-sm"
                  >
                    <Share2 size={16} />
                    {language === 'hi' ? 'WhatsApp पर रसीद भेजें' : 'Share Receipt on WhatsApp'}
                  </button>
                )}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {t('customer.orderSuccessFooter')}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
