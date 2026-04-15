import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, ShieldAlert, Users, CreditCard, 
  Zap, TrendingUp, ShieldCheck 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';
import GlassCard from '../ui/GlassCard';

interface VisualTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminStepIcons = [
  ShieldAlert, Users, CreditCard, Zap, TrendingUp, ShieldCheck
];

const adminStepColors = [
  "rose", "blue", "emerald", "amber", "purple", "cyan"
];

export default function AdminTutorial({ isOpen, onClose }: VisualTutorialProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const totalSteps = 6;

  const next = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
    else onClose();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const Icon = adminStepIcons[currentStep];
  const color = adminStepColors[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-3xl"
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          className="w-full max-w-2xl relative"
        >
          <GlassCard intensity="high" className="overflow-hidden border-white/20 shadow-[-20px_-20px_100px_rgba(255,255,255,0.05),20px_20px_100px_rgba(0,0,0,0.5)]">
            {/* Professional Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary/20 rounded-2xl border border-brand-primary/30">
                  <ShieldCheck size={24} className="text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-[0.25em] text-xs">
                    {t('admin_tutorial.title')}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Orchestration Phase</span>
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] text-brand-primary font-black uppercase tracking-widest">{currentStep + 1} / {totalSteps}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="p-12 text-center min-h-[450px] flex flex-col items-center justify-center relative overflow-hidden">
              {/* Background Glow */}
              <div className={`absolute -top-24 -left-24 w-64 h-64 bg-${color}-500/10 blur-[100px] rounded-full pointer-events-none`} />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 200 }}
                  className="space-y-10 relative z-10"
                >
                  <div className="relative group mx-auto w-32">
                    <div className={`absolute inset-0 bg-${color}-500/30 blur-[60px] rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-1000`} />
                    <div className={`
                      relative w-32 h-32 rounded-[2.5rem] flex items-center justify-center
                      bg-slate-900/80 text-${color}-500
                      border-2 border-${color}-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5)]
                      backdrop-blur-xl group-hover:scale-110 transition-transform duration-700
                    `}>
                      <Icon size={64} strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-white tracking-tighter leading-none whitespace-nowrap">
                      {t(`admin_tutorial.steps.${currentStep}.title`)}
                    </h2>
                    <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
                      {t(`admin_tutorial.steps.${currentStep}.description`)}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="p-10 bg-black/60 border-t border-white/5 flex flex-col gap-8">
              {/* Modern Progress Indicator */}
              <div className="flex justify-between items-center px-2">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div 
                    key={i}
                    className={`flex-1 h-1.5 rounded-full mx-1 transition-all duration-700 ${
                      i <= currentStep ? `bg-${adminStepColors[i]}-500 shadow-[0_0_15px_rgba(0,0,0,0.5)]` : 'bg-white/5'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-6">
                {currentStep > 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={prev}
                    className="flex-1 py-5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl"
                  >
                    <ChevronLeft size={22} className="mr-3" />
                    {t('admin_tutorial.back')}
                  </Button>
                )}
                <Button 
                  onClick={next}
                  className="flex-[2] py-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-xl font-black rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary"
                >
                  {currentStep === totalSteps - 1 
                    ? (
                      <span className="flex items-center gap-3">
                        <ShieldCheck size={24} />
                        {t('admin_tutorial.gotIt')}
                      </span>
                    )
                    : (
                      <span className="flex items-center gap-2">
                        {t('admin_tutorial.next')}
                        <ChevronRight size={22} />
                      </span>
                    )
                  }
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
