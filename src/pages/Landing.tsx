import { useEffect, useState } from 'react';
import { Store, ShoppingCart, Moon, Sun, Download, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useTalkingCharacter } from '../context/TalkingCharacterContext';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const { user, isAdmin } = useAuth();
  const { speak } = useTalkingCharacter();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Initial Welcome Greeting
    const timer = setTimeout(() => {
      speak(
        language === 'hi' 
          ? 'नमस्ते! मैं धरा हूँ। ऑर्डर-\\दो\\ में आपका स्वागत है। आप दुकान खोल सकते हैं या ऑर्डर शुरू कर सकते हैं।' 
          : 'Namaste! I am Dhara. Welcome to Order-\\Do\\. You can open your shop or start an order.'
      );
    }, 1500);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [speak, language]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30 dark:opacity-20 mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'url("/bg-shops.png")' }}
      />
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-kirana-green/20 rounded-full mix-blend-multiply filter blur-3xl dark:mix-blend-overlay"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-kirana-orange/20 rounded-full mix-blend-multiply filter blur-3xl dark:mix-blend-overlay"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4 flex gap-3 z-10 items-center"
      >
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-xl text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-90"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-8 rounded-[2rem] glass-panel text-center border border-white/20 dark:border-slate-700/50"
      >

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md mb-6 shadow-2xl p-4 border border-white/20">
            <img src="/logo.png" alt="Order-Do Logo" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Order-<span className="text-kirana-green">Do</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            {t('customer.instruction')}
          </p>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/shop/login" className="block w-full relative group overflow-hidden rounded-2xl p-[2px] focus:outline-none focus:ring-4 focus:ring-kirana-orange/50 active:scale-95 transition-all shadow-lg shadow-kirana-orange/10">
              <span className="absolute inset-0 bg-gradient-to-r from-kirana-orange to-amber-500 opacity-100"></span>
              <div className="relative flex items-center justify-center gap-3 w-full bg-white/10 backdrop-blur-sm px-6 py-4 rounded-[14px]">
                <Store size={24} className="text-white" />
                <span className="text-xl font-semibold text-white tracking-wide">{t('common.openShop')}</span>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button 
              onClick={() => alert(t('common.comingSoon'))}
              className="w-full relative group overflow-hidden rounded-2xl p-[2px] focus:outline-none focus:ring-4 focus:ring-kirana-green/50 active:scale-95 transition-all shadow-lg shadow-kirana-green/10"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-kirana-green to-emerald-500 opacity-100 opacity-80 group-hover:opacity-100"></span>
              <div className="relative flex items-center justify-center gap-3 w-full bg-white/10 backdrop-blur-sm px-6 py-4 rounded-[14px]">
                <ShoppingCart size={24} className="text-white" />
                <span className="text-xl font-semibold text-white tracking-wide">{t('customer.startOrder')}</span>
              </div>
            </button>
          </motion.div>

          {user && isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-2"
            >
               <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-kirana-orange to-amber-600 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all text-sm"
              >
                <Shield size={18} />
                {t('dashboard.adminPanel')}
              </button>
            </motion.div>
          )}
        </div>

        {isInstallable && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-left"
          >
            <div className="flex items-center justify-between gap-4 bg-kirana-light dark:bg-slate-800 p-4 rounded-xl border border-kirana-green/20">
              <div>
                <h3 className="text-sm font-semibold text-kirana-dark dark:text-kirana-light uppercase tracking-wider">{t('common.installApp')}</h3>
                <p className="text-xs text-kirana-green/80 dark:text-slate-400 mt-1">{t('common.installDesc')}</p>
              </div>
              <button 
                onClick={handleInstallClick}
                className="flex items-center justify-center w-10 h-10 bg-kirana-green text-white rounded-full hover:bg-kirana-dark active:scale-90 transition-all shadow-md shrink-0"
              >
                <Download size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
