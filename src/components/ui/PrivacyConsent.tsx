import { motion } from 'framer-motion';
import { ShieldCheck, EyeOff, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';

interface PrivacyConsentProps {
  onAgree: () => void;
  title?: string;
  description?: string;
}

export default function PrivacyConsent({ 
  onAgree, 
  title = "Privacy Protection Active",
  description = "Aapki privacy ke liye is screen ka screenshot lena mana hai. Order-Do anti-screenshot technology use karta hai."
}: PrivacyConsentProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-xs w-full bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl space-y-6 border border-slate-100 dark:border-slate-700 text-center"
      >
        <div className="w-20 h-20 bg-kirana-green/10 text-kirana-green rounded-full flex items-center justify-center mx-auto mb-2 border border-kirana-green/20">
          <ShieldCheck size={40} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            {title}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {description}
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl flex items-start gap-3 text-left">
           <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
           <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
              SCREENSHOT LENA POLICY VIOLATION HAI. DETECT HONE PAR APP BLOCK HO JAYEGI.
           </p>
        </div>

        <Button onClick={onAgree} className="w-full h-14 bg-slate-800 hover:bg-slate-700 border-none transition-all active:scale-95 shadow-lg">
           Mera Consent Hai / I Agree
        </Button>

        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 opacity-50">
           <EyeOff size={10} className="inline mr-1" /> Anti-Capture Protection v3.0
        </p>
      </motion.div>
    </div>
  );
}
