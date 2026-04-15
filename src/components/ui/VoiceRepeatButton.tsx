import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useVoice } from '../../context/VoiceContext';
import { motion, AnimatePresence } from 'framer-motion';
import haptics from '../../utils/haptics';

export default function VoiceRepeatButton() {
  const { repeatLast, isSpeaking, isMuted, setIsMuted } = useVoice();

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col gap-2.5">
      {/* Repeat last instruction button — only visible when unmuted */}
      <AnimatePresence>
        {!isMuted && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              repeatLast();
              haptics.light();
            }}
            className={`p-3.5 rounded-2xl shadow-2xl transition-all flex items-center gap-2 backdrop-blur-md ${
              isSpeaking 
                ? 'bg-gradient-to-r from-kirana-orange to-amber-500 text-white ring-4 ring-kirana-orange/20 shadow-kirana-orange/30' 
                : 'bg-white/90 dark:bg-slate-800/90 text-kirana-orange dark:text-amber-400 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl'
            }`}
            title="Phir se suniye"
            aria-label="Repeat last voice instruction"
          >
            <RotateCcw size={20} className={isSpeaking ? 'animate-spin' : ''} style={{ animationDuration: '2s' }} />
            <AnimatePresence>
              {isSpeaking && (
                <motion.span 
                  initial={{ width: 0, opacity: 0 }} 
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap overflow-hidden"
                >
                  Bol rahi hoon...
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mute/Unmute toggle */}
      <motion.button
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.85 }}
        onClick={() => {
          setIsMuted(!isMuted);
          haptics.medium();
        }}
        className={`p-2.5 rounded-xl shadow-lg transition-all border backdrop-blur-md ${
          isMuted 
            ? 'bg-slate-200/90 dark:bg-slate-900/90 border-slate-300/50 dark:border-slate-700/50 text-slate-400' 
            : 'bg-white/90 dark:bg-slate-800/90 border-kirana-green/20 dark:border-kirana-green/10 text-kirana-green shadow-kirana-green/10'
        }`}
        title={isMuted ? "Awaaz Chalu Karein" : "Awaaz Band Karein"}
        aria-label={isMuted ? "Unmute voice" : "Mute voice"}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </motion.button>
    </div>
  );
}
