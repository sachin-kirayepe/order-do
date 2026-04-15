import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, LayoutDashboard, UserCircle, QrCode, 
  Layers, Bell, ListOrdered, ShieldCheck, FileText, HelpCircle 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';
import GlassCard from '../ui/GlassCard';

interface VisualTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const stepIcons = [
  LayoutDashboard, UserCircle, QrCode, Layers, Bell, ListOrdered, ShieldCheck, FileText
];

const stepColors = [
  "blue", "green", "purple", "indigo", "orange", "emerald", "rose", "cyan"
];

export default function ShopTutorial({ isOpen, onClose }: VisualTutorialProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  // Since translations are dynamic, we get the steps array length from t roughly, 
  // but we know it's 8 from our script.
  const totalSteps = 8;

  const next = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
    else onClose();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const Icon = stepIcons[currentStep];
  const color = stepColors[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-lg relative"
        >
          <GlassCard intensity="high" className="overflow-hidden border-white/20 shadow-2xl">
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-primary/20 rounded-xl">
                  <HelpCircle size={20} className="text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.15em] text-[10px]">
                    {t('tutorial.shopTitle')}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">Step {currentStep + 1} of {totalSteps}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-10 text-center min-h-[400px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -60, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 180 }}
                  className="space-y-8"
                >
                  {/* Icon Container with multi-layered glow */}
                  <div className="relative group">
                    <div className={`absolute inset-0 bg-${color}-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity whitespace-nowrap`} />
                    <div className={`
                      relative w-28 h-28 mx-auto rounded-[2rem] flex items-center justify-center
                      bg-${color}-500/10 text-${color}-500
                      border border-white/20 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500
                    `}>
                      <Icon size={52} strokeWidth={2.5} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {t(`tutorial.steps.${currentStep}.title`)}
                    </h2>
                    <p className="text-base text-slate-500 dark:text-slate-300 font-bold leading-relaxed max-w-[320px] mx-auto">
                      {t(`tutorial.steps.${currentStep}.description`)}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="p-8 bg-black/40 border-t border-white/5 flex flex-col gap-6">
              {/* Progress Dots */}
              <div className="flex justify-center gap-2.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div 
                    key={i}
                    className={`h-2 rounded-full transition-all duration-500 ${i === currentStep ? 'w-10 bg-brand-primary' : 'w-2 bg-white/10'}`}
                  />
                ))}
              </div>

              <div className="flex gap-4">
                {currentStep > 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={prev}
                    className="flex-1 py-4 border border-white/10 text-slate-400 hover:text-white"
                  >
                    <ChevronLeft size={20} className="mr-2" />
                    {t('tutorial.back')}
                  </Button>
                )}
                <Button 
                  onClick={next}
                  className="flex-[2] py-4 shadow-glow-green text-lg font-black"
                >
                  {currentStep === totalSteps - 1 
                    ? t('tutorial.gotIt') 
                    : t('tutorial.next')
                  }
                  {currentStep < totalSteps - 1 && <ChevronRight size={20} className="ml-2" />}
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
