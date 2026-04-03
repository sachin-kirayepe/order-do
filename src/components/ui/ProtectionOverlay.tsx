import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ProtectionOverlayProps {
  isVisible: boolean;
}

export default function ProtectionOverlay({ isVisible }: ProtectionOverlayProps) {
  const { } = useLanguage();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 bg-slate-900 border-4 border-red-500/50 backdrop-blur-3xl overflow-hidden"
        >
          {/* Moving Warning Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none select-none overflow-hidden flex flex-wrap gap-4 rotate-12 scale-150">
             {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="text-red-500 font-black text-2xl uppercase whitespace-nowrap">
                   SCREENSHOT PROHIBITED • सुरक्षा हेतु स्क्रीन ब्लॉक की गई है
                </div>
             ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6 relative z-10"
          >
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/20">
              <ShieldAlert size={48} className="text-red-500" />
            </div>
            
            <div className="space-y-2">
               <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                  Screenshot Restricted
               </h2>
               <p className="text-red-400 font-bold text-xl uppercase tracking-widest flex items-center justify-center gap-2">
                  <AlertTriangle size={20} />
                  स्क्रीनशॉट लेना मना है
               </p>
            </div>

            <p className="max-w-xs text-slate-400 text-lg">
               Aapki privacy ke liye is app ne security protection lagaya hai. Screenshot lene par aapka account ban ho sakta hai.
            </p>
          </motion.div>

          <footer className="absolute bottom-8 text-slate-600 text-xs font-mono uppercase tracking-[0.3em]">
             Order-Do // Advanced Security v2.6.4
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
