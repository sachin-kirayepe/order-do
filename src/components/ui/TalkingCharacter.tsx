import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, RotateCw, Sparkles } from 'lucide-react';
import { useTalkingCharacter } from '../../context/TalkingCharacterContext';
import VirtualInstructor from './VirtualInstructor';

function TextBubble({ text }: { text: string }) {
  if (!text) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.5 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.5 }}
      className="absolute right-full mr-4 bottom-24 w-48 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl border border-white/40 dark:border-slate-700/50 shadow-2xl z-50"
    >
      <div className="absolute -right-2 bottom-6 w-4 h-4 bg-white/80 dark:bg-slate-900/80 rotate-45 border-r border-t border-white/20 dark:border-slate-700/20" />
      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
        {text}
      </p>
      <div className="mt-2 flex gap-1">
        <div className="w-1.5 h-1.5 bg-kirana-green rounded-full animate-bounce" />
        <div className="w-1.5 h-1.5 bg-kirana-green rounded-full animate-bounce delay-100" />
        <div className="w-1.5 h-1.5 bg-kirana-green rounded-full animate-bounce delay-200" />
      </div>
    </motion.div>
  );
}

export default function TalkingCharacter() {
  const { isVisible, isMuted, toggleMute, isSpeaking, stop, repeat, currentText, action } = useTalkingCharacter();
  const [minimized, setMinimized] = useState(false);
  const [hasCanvasError, setHasCanvasError] = useState(false);

  // Auto-show logic
  useEffect(() => {
    if (isSpeaking) setMinimized(false);
  }, [isSpeaking]);

  if (!isVisible && !isSpeaking) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          y: minimized ? 0 : [0, -10, 0], 
          scale: 1,
          width: minimized ? 60 : 220,
          height: minimized ? 60 : 320
        }}
        transition={{
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 0.5 },
          scale: { duration: 0.5 }
        }}
        exit={{ opacity: 0, y: 50, scale: 0.8 }}
        className="fixed bottom-6 right-6 z-[9999] flex flex-col pointer-events-none"
      >
        {/* Assistant UI controls */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-50 pointer-events-auto">
           <button 
            onClick={toggleMute}
            className={`p-2 rounded-full backdrop-blur-xl border transition-all active:scale-90 shadow-xl ${isMuted ? 'bg-red-500/80 border-red-400 text-white' : 'bg-white/20 dark:bg-slate-800/20 border-white/30 text-slate-700 dark:text-white'}`}
            title="Mute/Unmute"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          {!isSpeaking && (
            <button 
              onClick={repeat}
              className="p-2 rounded-full bg-white/20 dark:bg-slate-800/20 backdrop-blur-xl border border-white/30 text-slate-700 dark:text-white transition-all active:scale-90 shadow-xl"
              title="Repeat Instruction"
            >
              <RotateCw size={16} />
            </button>
          )}
          <button 
            onClick={() => { if (isSpeaking) stop(); setMinimized(!minimized); }}
            className="p-2 rounded-full bg-white/20 dark:bg-slate-800/20 backdrop-blur-xl border border-white/30 text-slate-700 dark:text-white transition-all active:scale-90 shadow-xl"
          >
            {minimized ? <Sparkles size={16} className="text-kirana-green" /> : <X size={16} />}
          </button>
        </div>

        {!minimized ? (
          <div className="flex-1 relative group pointer-events-auto flex items-center justify-center">
            {/* Ambient Base Glow */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-kirana-green/20 to-transparent blur-3xl pointer-events-none opacity-50" />
            
            <AnimatePresence>
               <TextBubble text={currentText} />
            </AnimatePresence>

            <div className="w-full h-full cursor-pointer relative" onClick={repeat}>
                {!hasCanvasError ? (
                    <Canvas 
                      shadows 
                      dpr={[1, 2]} 
                      onCreated={({ gl }) => {
                        gl.setClearColor('#000000', 0);
                      }}
                      onError={() => setHasCanvasError(true)}
                    >
                        <VirtualInstructor />
                    </Canvas>
                ) : (
                    /* 2D PREMIUM ILLUSTRATION FALLBACK (100% VISIBLE) */
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-full flex flex-col items-center justify-end pb-8"
                    >
                        <div className="relative w-32 h-32 mb-4">
                            {/* Stylish Dhara Illustration - Professional Face & Ponytail */}
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                            <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-full border-4 border-white/50 dark:border-slate-700/50 shadow-xl overflow-hidden flex items-center justify-center p-2">
                                <img 
                                    src="/logo.png" 
                                    alt="Dhara" 
                                    className={`w-full h-full object-contain ${isSpeaking ? 'animate-bounce' : 'animate-float'}`} 
                                    onError={(e) => {
                                        // If even the logo fails, use a Lucide icon
                                        (e.target as any).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dhara&baseColor=f5d0c5&clothing=collar&hair=long';
                                    }}
                                />
                            </div>
                            {/* Mouth Wave (2D LipSync) */}
                            {isSpeaking && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-1 h-3 bg-kirana-green rounded-full animate-bubble" style={{animationDelay: `${i*0.1}s`}} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-black uppercase text-kirana-green tracking-widest bg-kirana-green/10 px-3 py-1 rounded-full border border-kirana-green/20">
                           {isSpeaking ? 'Live Assistant' : 'Dhara'}
                        </span>
                    </motion.div>
                )}
            </div>
            
            {/* Visual Action Cues */}
            {action !== 'idle' && (
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute bottom-12 right-6 p-2 bg-kirana-green/80 rounded-xl text-white shadow-lg"
                >
                    <Sparkles size={12} className="animate-spin-slow" />
                </motion.div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => setMinimized(false)}
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-kirana-green to-emerald-600 text-white rounded-full shadow-2xl pointer-events-auto ring-4 ring-white/20 transition-transform active:scale-90"
          >
            <div className="relative">
                {isSpeaking && <div className="w-10 h-10 rounded-full border-2 border-white/50 animate-ping absolute -inset-1" />}
                <div className="w-8 h-8 rounded-full bg-white text-kirana-green flex items-center justify-center">
                    {isSpeaking ? <Volume2 size={18} className="animate-bounce" /> : <Sparkles size={18} />}
                </div>
            </div>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
