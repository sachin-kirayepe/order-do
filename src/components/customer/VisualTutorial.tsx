import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, QrCode, Camera, Mic, ClipboardCheck, PartyPopper, Phone, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';
import GlassCard from '../ui/GlassCard';

interface Step {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const steps: Step[] = [
  {
    title: "Step 1: App Ko Rakhein",
    description: "Link pe click karke app ko home screen pe 'Install' kar lein takii ye hamesha ke liye aapke phone mein rahe.",
    icon: Phone,
    color: "blue"
  },
  {
    title: "Step 2: QR Scan Karein",
    description: "Dukaan ka QR code scan karein ya WhatsApp link se dukan kholein. Ye bohot aasaan hai!",
    icon: QrCode,
    color: "green"
  },
  {
    title: "Step 3: Selfie Lein",
    description: "Apni ek saaf photo lein takii dukan vale bhaiya aapko asani se pehchaan lein. Ye bilkul safe hai.",
    icon: Camera,
    color: "purple"
  },
  {
    title: "Step 4: Bolkar Order Karein",
    description: "Ab type mat kijiye! Mic button dabakar apna naam aur saman ka naam bol dijiye.",
    icon: Mic,
    color: "red"
  },
  {
    title: "Step 5: Order Check Karein",
    description: "Aapne jo bhi bola, uski list app khud bana degi. Ek bar check kar lein.",
    icon: ClipboardCheck,
    color: "orange"
  },
  {
    title: "Step 6: Confirm Karein",
    description: "Sab theek hai toh 'Confirm Order' daba dein. Dukan vale ko turant pata chal jayega.",
    icon: PartyPopper,
    color: "pink"
  }
];

interface VisualTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VisualTutorial({ isOpen, onClose }: VisualTutorialProps) {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
    else onClose();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-md relative"
        >
          <GlassCard intensity="high" className="overflow-hidden border-white/20">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-primary/10 rounded-lg">
                  <HelpCircle size={18} className="text-brand-primary" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  {language === 'hi' ? 'Kaise Order Karein?' : 'How to Order?'}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-8 text-center min-h-[350px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="space-y-6"
                >
                  <div className={`
                    w-24 h-24 mx-auto rounded-3xl flex items-center justify-center
                    bg-${steps[currentStep].color}-500/10 text-${steps[currentStep].color}-500
                    shadow-xl border border-white/10
                  `}>
                    {React.createElement(steps[currentStep].icon, { size: 48, strokeWidth: 2.5 })}
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      {language === 'hi' ? steps[currentStep].title : steps[currentStep].title.replace(/[^a-zA-Z0-9 ]/g, '').replace('Karein', '').replace('Lein', '').replace('Rakhein', '')}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                      {language === 'hi' ? steps[currentStep].description : "Simple step to complete your order process smoothly."}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 bg-slate-900/50 flex flex-col gap-4">
              {/* Progress Dots */}
              <div className="flex justify-center gap-2 mb-2">
                {steps.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-brand-primary' : 'w-2 bg-white/20'}`}
                  />
                ))}
              </div>

              <div className="flex gap-4">
                {currentStep > 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={prev}
                    className="flex-1 border border-white/10"
                  >
                    {language === 'hi' ? 'Piche' : 'Back'}
                  </Button>
                )}
                <Button 
                  onClick={next}
                  className="flex-[2] shadow-glow-green"
                >
                  {currentStep === steps.length - 1 
                    ? (language === 'hi' ? 'Samajh Gaya!' : 'Got it!') 
                    : (language === 'hi' ? 'Aage' : 'Next')
                  }
                  <ChevronRight size={18} className="ml-2" />
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
