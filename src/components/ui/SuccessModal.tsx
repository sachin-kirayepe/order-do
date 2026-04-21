import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Home, Sparkles, Receipt, Star, Shield, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import Confetti from './Confetti';
import GlassCard from './GlassCard';
import Button from './Button';
import haptics from '../../utils/haptics';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId?: string;
  shopUUID?: string;
  orderId?: string;
  orderSummary?: {
    customerName: string;
    totalAmount: number;
    itemsCount: number;
  };
  onShareReceipt?: () => void;
  orderStatus?: string; // e.g. 'pending', 'accepted', 'preparing', 'ready', 'completed'
  feedbackEnabled?: boolean;
  onConfirmPickup?: () => Promise<void>;
  onDispute?: (reason: string, screenshot: string) => Promise<void>;
  pickupOtp?: string;
  originalTranscript?: string;
  initialTotal?: number;
}

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  shopUUID,
  orderId,
  orderSummary, 
  onShareReceipt,
  orderStatus = 'pending',
  feedbackEnabled = true,
  onConfirmPickup,
  onDispute,
  pickupOtp,
  originalTranscript,
  initialTotal
}: SuccessModalProps) {
  const { t, language } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return language === 'hi' ? 'दुकानदार का इंतज़ार' : 'Waiting for shop';
      case 'accepted': return language === 'hi' ? 'स्वीकार किया गया' : 'Order Accepted';
      case 'preparing': return language === 'hi' ? 'बन रहा है' : 'Preparing Order';
      case 'ready': return language === 'hi' ? 'तैयार है!' : 'Ready for Pickup';
      case 'completed': return language === 'hi' ? 'मौज लो!' : 'Enjoy your meal!';
      default: return status.toUpperCase();
    }
  };

  const statusProgress = {
    'pending': 20,
    'accepted': 40,
    'preparing': 60,
    'ready': 80,
    'completed': 100
  };

  const handleRatingSubmit = async () => {
    if (rating === 0 || !shopUUID) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        shop_id: shopUUID,
        order_id: orderId || null,
        rating: rating,
        comment: comment.trim() || null
      });

      if (error) throw error;
      setFeedbackSent(true);
      toast.success(language === 'hi' ? 'फीडबैक के लिए धन्यवाद!' : 'Thanks for your feedback!');
      haptics.success();
    } catch (err) {
      toast.error('Failed to send feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const handleDisputeSubmit = async () => {
    if (!disputeReason.trim() || !onDispute) return;
    setIsSubmitting(true);
    await onDispute(disputeReason, ''); // Screenshot logic could be added later
    setShowDisputeModal(false);
    setIsSubmitting(false);
    onClose();
  };

  const showFeedback = feedbackEnabled && (orderStatus === 'ready' || orderStatus === 'completed');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            className="relative w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            {orderStatus === 'completed' && <Confetti />}
            
            <GlassCard intensity="high" className="border-white/20 dark:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <div className="p-8 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-10 blur-[50px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-secondary opacity-10 blur-[50px] rounded-full" />

                <div className="w-full mb-8 space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary animate-pulse">
                      {getStatusLabel(orderStatus)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Live Tracker</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-[1px]">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ width: `${(statusProgress as any)[orderStatus] || 20}%` }}
                      className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full shadow-glow-green"
                    />
                  </div>
                </div>

                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center mb-6 border border-brand-primary/20 shadow-glow-green/20 relative"
                >
                  <CheckCircle size={44} className="text-brand-primary" />
                </motion.div>

                <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase italic tracking-tighter mb-4">
                  {t('customer.orderSuccessTitle')}
                </h2>

                {/* Verification ID Section */}
                <div className="w-full grid grid-cols-2 gap-3 mb-6">
                  {orderId && (
                    <div className="p-4 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 relative overflow-hidden">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Order ID</p>
                      <span className="text-sm font-mono font-black text-brand-primary uppercase italic">
                        ORD-{orderId.slice(0, 4).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {pickupOtp && (
                    <div className="p-4 bg-brand-primary/10 rounded-2xl border-2 border-brand-primary shadow-glow-green/20 relative overflow-hidden">
                      <p className="text-[8px] font-black uppercase tracking-widest text-brand-primary mb-1">Pickup OTP</p>
                      <span className="text-xl font-mono font-black text-brand-primary tracking-widest">
                        {pickupOtp}
                      </span>
                      <div className="absolute top-0 right-0 p-1">
                        <Lock size={10} className="text-brand-primary animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                {/* ANTI-FRAUD: Price & Weight Guard */}
                <div className="w-full space-y-3 mb-6">
                  {initialTotal !== undefined && orderSummary && orderSummary.totalAmount > initialTotal && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-start gap-3 text-left"
                    >
                      <Shield className="text-orange-500 shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Price Discrepancy Detected</p>
                        <p className="text-[9px] font-bold text-slate-500 leading-tight mt-0.5">
                          {language === 'hi' 
                            ? `Shopkeeper ne bill ₹${orderSummary.totalAmount - initialTotal} badha diya hai. Kripya check karein.`
                            : `Shopkeeper increased bill by ₹${orderSummary.totalAmount - initialTotal}. Please verify items.`}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {orderStatus === 'ready' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-start gap-3 text-left"
                    >
                      <Sparkles className="text-brand-primary shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Quantity Guard Active</p>
                        <p className="text-[9px] font-bold text-slate-500 leading-tight mt-0.5">
                          {language === 'hi' 
                            ? 'Saman lete waqt uska wazan (weight) aur ginti zaroor check karein!'
                            : 'Please verify the weight and count of items before providing the Pickup OTP.'}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {originalTranscript && (
                    <div className="p-3 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-left">
                       <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Your Voice Record</p>
                       <p className="text-[10px] italic font-medium text-slate-600 dark:text-slate-400 leading-tight">"{originalTranscript}"</p>
                    </div>
                  )}
                </div>

                {/* Feedback Section */}
                {showFeedback && !feedbackSent && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-white/40 dark:bg-slate-900/40 p-5 rounded-[2rem] border border-white/20 mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">How was your experience?</p>
                    <div className="flex justify-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => { setRating(star); haptics.light(); }}
                          className="transition-transform active:scale-90"
                        >
                          <Star 
                            size={28} 
                            className={`transition-colors ${
                              star <= (hoverRating || rating) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-slate-300 dark:text-slate-700'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                        <textarea
                          placeholder={language === 'hi' ? 'कुछ कहना चाहेंगे?' : 'Any comments?'}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full bg-white/60 dark:bg-slate-800/60 border border-white/20 rounded-xl p-3 text-sm focus:ring-2 ring-brand-primary outline-none transition-all resize-none h-20"
                        />
                        <Button 
                          onClick={handleRatingSubmit} 
                          isLoading={isSubmitting} 
                          variant="primary" 
                          className="w-full h-10 !rounded-xl text-xs uppercase font-black"
                        >
                          Submit Feedback
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {feedbackSent && (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6 p-4 bg-green-500/10 rounded-2xl border border-green-500/20 text-green-500 text-xs font-bold italic">
                    <Sparkles size={16} className="inline mr-2" />
                    Thank you for the magic feedback!
                  </motion.div>
                )}

                {orderSummary && !showFeedback && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="w-full p-6 rounded-[2rem] bg-white/40 dark:bg-slate-950/40 border border-white/20 dark:border-white/5 shadow-inner space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory</span>
                       <span className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{orderSummary.itemsCount} {t('report.items')}</span>
                    </div>

                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center group">
                       <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Settlement</span>
                       <span className="text-xl font-black text-brand-primary tracking-tighter italic">₹{orderSummary.totalAmount}</span>
                    </div>
                  </motion.div>
                )}

                <div className="w-full space-y-4">
                  {orderStatus === 'ready' && onConfirmPickup && (
                    <Button 
                      onClick={onConfirmPickup} 
                      variant="primary" 
                      className="w-full h-14 !rounded-xl shadow-glow-green text-sm font-black uppercase italic tracking-widest text-white animate-bounce"
                    >
                      <CheckCircle size={18} className="mr-3" />
                      {language === 'hi' ? 'ऑर्डर मिल गया ✓' : 'I have received Order ✓'}
                    </Button>
                  )}

                  {orderStatus === 'rejected' && onDispute && (
                    <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 mb-4">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Order Rejected? If paid via UPI, dispute it.</p>
                      {showDisputeModal ? (
                        <div className="space-y-3">
                          <textarea
                            placeholder="Why are you disputing? (e.g. Paid but rejected)"
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-red-500/30 rounded-xl p-2 text-xs outline-none h-16"
                          />
                          <Button onClick={handleDisputeSubmit} isLoading={isSubmitting} className="w-full h-10 !bg-red-500 !text-white !rounded-xl text-[10px] uppercase font-black">
                            Register Dispute
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => setShowDisputeModal(true)} variant="ghost" className="w-full h-10 !rounded-xl text-[10px] uppercase font-black text-red-500 border border-red-500/30">
                          Raise a Dispute
                        </Button>
                      )}
                    </div>
                  )}

                  {onShareReceipt && (
                    <Button onClick={onShareReceipt} variant="ghost" className="w-full h-14 !rounded-xl text-sm font-black uppercase text-brand-primary tracking-widest border border-brand-primary/20">
                      <Receipt size={18} className="mr-3" />
                      Share Receipt
                    </Button>
                  )}
                  <Button onClick={onClose} variant="primary" className="w-full h-14 !rounded-xl shadow-glow-green text-sm font-black uppercase italic tracking-widest text-white">
                    <Home size={18} className="mr-3" />
                    {t('common.home')}
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
