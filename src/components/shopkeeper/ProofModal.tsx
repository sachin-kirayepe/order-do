import type { OrderHistory } from '../../db/dexie';
import { X, Shield, Clock, Hash, Camera, User, ClipboardList, IndianRupee } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import SecureCanvas from '../ui/SecureCanvas';

interface ProofModalProps {
  order: OrderHistory;
  onClose: () => void;
}

export default function ProofModal({ order, onClose }: ProofModalProps) {
  const { language } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-[2.5rem] rounded-t-[3rem] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-500/10 rounded-xl">
               <Shield className="text-blue-500" size={20} />
             </div>
             <div>
               <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Order Proof</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Privacy Protected System</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          
          {/* Status Alert */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
            <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
              {language === 'hi' 
                ? 'ग्राहक की गोपनीयता की सुरक्षा के लिए उनकी निजी जानकारी डिलीट कर दी गई है। नीचे दिया गया डेटा भविष्य के वेरिफिकेशन के लिए "प्रूफ" के रूप में रखा गया है।' 
                : 'Personal data has been deleted to protect customer privacy. The data below is retained as "Proof" for future verification/disputes.'}
            </p>
          </div>

          {/* Proof Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                 <Camera size={10} /> Blurred Photo
               </label>
               <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {order.proofBlurredPhoto && (
                    <SecureCanvas image={order.proofBlurredPhoto} width={200} height={200} className="w-full h-full border-none" tagline="PROOF" />
                  )}
               </div>
            </div>
            <div className="space-y-4">
               <div>
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                   <User size={10} /> Hashed Name
                 </label>
                 <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-mono break-all text-slate-500 dark:text-slate-400 line-clamp-3">
                      {order.proofHashedName || 'N/A'}
                    </p>
                 </div>
               </div>
               <div>
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                   <Clock size={10} /> Completed At
                 </label>
                 <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
                   {new Date(order.completedAt).toLocaleString()}
                 </p>
               </div>
            </div>
          </div>

          {/* Order Details Token */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
               <Hash size={10} /> Unique Order Token
            </label>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
               <p className="text-[11px] font-mono font-bold text-kirana-orange text-center">{order.orderToken || 'N/A'}</p>
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
               <ClipboardList size={10} /> Items
            </label>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-kirana-green/10 text-kirana-green flex items-center justify-center rounded-md text-[10px] font-black">{item.quantity}</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 italic">₹{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-slate-900 dark:bg-kirana-green/10 p-5 rounded-[2rem] flex items-center justify-between border border-white/10 mt-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-kirana-green/20 rounded-full flex items-center justify-center">
                 <IndianRupee className="text-kirana-green" size={20} />
               </div>
               <span className="text-sm font-black text-white dark:text-kirana-green uppercase italic">Total Paid</span>
             </div>
             <span className="text-2xl font-black text-white dark:text-kirana-green font-mono">₹{order.total}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-4 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-tighter italic shadow-xl active:scale-95 transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
