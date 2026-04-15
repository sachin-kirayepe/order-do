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
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-8 bg-black/95 backdrop-blur-3xl overflow-hidden"
        >
          {/* Moving Warning Pattern (Fast) */}
          <div className="absolute inset-0 opacity-10 pointer-events-none select-none overflow-hidden flex flex-wrap gap-12 rotate-12 scale-150">
             {Array.from({ length: 60 }).map((_, i) => (
                <motion.div 
                  key={i} 
                  animate={{ x: [0, -20, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-red-500 font-black text-3xl uppercase italic tracking-tighter whitespace-nowrap"
                >
                   PROTECTED • NO SCREENSHOTS • सुरक्षा चेतावनी
                </motion.div>
             ))}
          </div>

          {/* Central Security Card */}
          <motion.div
            initial={{ scale: 0.5, y: 50, rotate: -5 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            className="glass-panel p-10 rounded-[3rem] border-2 border-red-500/50 flex flex-col items-center text-center space-y-8 relative z-10 shadow-[0_0_100px_rgba(239,68,68,0.2)]"
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-28 h-28 bg-red-500/20 rounded-3xl flex items-center justify-center border-2 border-red-500/30"
            >
              <ShieldAlert size={60} className="text-red-500" />
            </motion.div>
            
            <div className="space-y-3">
               <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                  Security Violation
               </h2>
               <div className="h-1 w-20 bg-red-500 mx-auto rounded-full" />
               <p className="text-red-400 font-black text-2xl uppercase tracking-widest flex items-center justify-center gap-3">
                  <AlertTriangle size={28} className="animate-pulse" />
                  स्क्रीनशॉट लेना मना है
               </p>
            </div>

            <p className="max-w-sm text-slate-300 text-xl font-bold leading-relaxed">
               Aapki security ke liye is page par screenshots restrict kiye gaye hain. Baar-baar koshish karne par aapka account permanent block ho sakta hai.
            </p>

            <motion.div 
              whileTap={{ scale: 0.9 }}
              className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg shadow-red-600/30 transition-all cursor-pointer select-none"
              onClick={() => window.location.reload()}
            >
               Tap to Refresh & Unlock
            </motion.div>
          </motion.div>

          <footer className="absolute bottom-12 text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-4">
             <div className="w-12 h-px bg-slate-800" />
             ORDER-DO SENTINEL v5.1.0 // ACTIVE PROTECTION
             <div className="w-12 h-px bg-slate-800" />
          </footer>

          {/* Dynamic Noise Grain OVER everything */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.15] bg-noise mix-blend-overlay animate-noise" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
