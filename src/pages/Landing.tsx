import { useEffect, useState } from 'react';
import { Store, ShoppingCart, Moon, Sun, Download, Shield, X, Eye, EyeOff, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import Footer from '../components/ui/Footer';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Input from '../components/ui/Input';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { language, t } = useLanguage();
  const { user, isAdmin } = useAuth();
  const { speak } = useVoice();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Admin login modal state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      speak('WELCOME');
    }, 1500);
    return () => clearTimeout(timer);
  }, [speak]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  const handleAdminButtonClick = () => {
    if (user && isAdmin) {
      navigate('/admin');
      return;
    }
    setShowAdminLogin(true);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    if (now < lockoutUntil) {
      const waitTime = Math.ceil((lockoutUntil - now) / 1000);
      setAdminError(`⚠️ Security Protocol: Wait ${waitTime}s before retry.`);
      return;
    }

    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAdminError('❌ Identity and Access Code required.');
      return;
    }

    setAdminLoading(true);
    setAdminError('');

    try {
      console.log('[Admin] Attempting master authorization...');
      
      // Nuclear clear of potentially stale Supabase state before we attempt login
      try {
        await supabase.auth.signOut({ scope: 'local' });
        localStorage.removeItem('supabase.auth.token');
      } catch (err) {
        console.warn('Silent local signout failed', err);
      }
      
      const loginPromise = supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword.trim()
      });

      // 10-second aggressive timeout to prevent infinite hang in the modal
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('CONNECTION_TIMEOUT')), 10000)
      );

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (error) {
        console.error('[Admin] Login error:', error.message);
        
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = '❌ Invalid Access Code - Authorization Denied.';
        } else if (msg.includes('Refresh Token Not Found')) {
          msg = '🔄 Session expired. Please refresh the page and try again.';
          localStorage.clear();
        } else if (msg.includes('CONNECTION_TIMEOUT')) {
          msg = '📡 Connection timed out. Please try again.';
          localStorage.clear();
        }
        
        setAdminError(msg);
        
        if (newFailedAttempts >= 5) {
          const timeout = 30000;
          setLockoutUntil(Date.now() + timeout);
          setAdminError(`⛔ Security Lockout: ${timeout/1000}s.`);
        }
        
        setAdminLoading(false);
        return;
      }

      if (data.user?.email !== 'sachinkumar647422.tools@gmail.com') {
        await supabase.auth.signOut();
        setAdminError('⛔ Access Denied — You are not the master owner.');
        setAdminLoading(false);
        return;
      }

      console.log('[Admin] Authorization granted. Accessing hub...');
      
      // Important: Ensure loading state ends so React can breathe
      setAdminLoading(false);
      setShowAdminLogin(false);
      
      // Delay navigation slightly to let Framer Motion close the modal first
      setTimeout(() => navigate('/admin'), 100);
    } catch (err: any) {
      console.error('[Admin] Critical failure:', err);
      let errMsg = err?.message || '📡 Secure connection failed. Try again.';
      if (err?.message === 'CONNECTION_TIMEOUT') {
         errMsg = '📡 Network timed out. Purging cache...';
         localStorage.clear();
      }
      setAdminError(errMsg);
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
      {/* Floating Animated Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -80, 0], y: [0, 100, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute -bottom-40 -left-20 w-[30rem] h-[30rem] bg-brand-secondary/10 rounded-full blur-[150px]" 
        />
      </div>

      {/* Floating Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-6 left-6 right-6 z-50 flex items-center justify-between pointer-events-none"
      >
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-12 h-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 dark:border-white/5 shadow-premium">
            <Sparkles className="text-brand-primary" size={24} />
          </div>
          <span className="hidden md:block font-black uppercase tracking-[0.3em] text-[10px] text-slate-500">Premium Version v2.0</span>
        </div>

        <div className="flex gap-2 pointer-events-auto bg-white/20 dark:bg-slate-900/20 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-glass">
          <LanguageSwitcher />
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full w-10 h-10 !p-0"
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
        </div>
      </motion.div>

      {/* Main Hero Card */}
      <GlassCard intensity="high" className="w-full max-w-xl p-8 md:p-12 text-center relative z-10 border-white/50 dark:border-white/10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-10"
        >
          <div className="w-24 h-24 mx-auto mb-8 relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary rounded-[2rem] opacity-20 blur-xl"
            />
            <div className="relative w-full h-full bg-white dark:bg-slate-900 rounded-[2rem] border border-white/20 shadow-2xl flex items-center justify-center p-5 overflow-hidden">
               <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            <span className="text-slate-900 dark:text-white">Order-</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-emerald-500">
              {language === 'hi' ? 'दो' : 'Do'}
            </span>
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
            {t('customer.instruction')}
          </p>
        </motion.div>

        <div className="grid gap-5">
          <Button 
            variant="secondary" 
            size="lg" 
            className="w-full h-20 !rounded-[1.5rem]"
            onClick={() => navigate('/shop/login')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl"><Store size={24} /></div>
                <div className="text-left">
                  <div className="block">{t('common.openShop')}</div>
                  <div className="text-[10px] opacity-60 normal-case italic font-medium -mt-1 tracking-normal">For Shop Owners</div>
                </div>
              </div>
              <ChevronRight size={20} className="opacity-40" />
            </div>
          </Button>

          <Button 
            variant="primary" 
            size="lg" 
            className="w-full h-20 !rounded-[1.5rem]"
            onClick={() => navigate('/order')}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl"><ShoppingCart size={24} /></div>
                <div className="text-left">
                  <div className="block">{t('customer.startOrder')}</div>
                  <div className="text-[10px] opacity-60 normal-case italic font-medium -mt-1 tracking-normal">Quick Voice Order</div>
                </div>
              </div>
              <ChevronRight size={20} className="opacity-40" />
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="w-full py-4 !rounded-[1.25rem] border-slate-200 dark:border-white/5"
            onClick={handleAdminButtonClick}
          >
            <Shield size={18} className="mr-2 text-brand-primary" />
            Admin Panel
          </Button>
        </div>

        {isInstallable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 pt-8 border-t border-slate-200 dark:border-white/5 flex items-center justify-between"
          >
            <div className="text-left">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('common.installApp')}</h4>
              <p className="text-xs text-slate-500 font-medium">{t('common.installDesc')}</p>
            </div>
            <Button size="sm" variant="ghost" className="rounded-full w-12 h-12 !p-0" onClick={handleInstallClick}>
              <Download size={20} />
            </Button>
          </motion.div>
        )}
      </GlassCard>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-3xl"
              onClick={() => setShowAdminLogin(false)}
            />
            <GlassCard intensity="high" className="w-full max-w-sm p-0 overflow-hidden relative z-10 border-white/20">
               <div className="p-8 bg-gradient-to-br from-slate-900 to-black text-center relative">
                  <button 
                    onClick={() => setShowAdminLogin(false)}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="w-20 h-20 bg-brand-primary/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-brand-primary/30">
                    <Shield size={36} className="text-brand-primary" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Secure Vault</h3>
                  <p className="text-[10px] text-brand-primary font-black uppercase tracking-[0.3em] mt-1">Authorized Access Only</p>
               </div>
               
               <form onSubmit={handleAdminLogin} className="p-8 space-y-6">
                 <div className="flex gap-3 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                    <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-200 font-bold leading-relaxed">
                      Unauthorized access is strictly prohibited and logged. This panel is for management only.
                    </p>
                 </div>

                 <Input 
                   label="Identity (Email)" 
                   placeholder="owner@order-do.com"
                   value={adminEmail}
                   onChange={(e) => setAdminEmail(e.target.value)}
                   type="email"
                   required
                 />
                 
                 <div className="relative">
                   <Input 
                     label="Access Code" 
                     placeholder="••••••••"
                     type={showPassword ? 'text' : 'password'}
                     value={adminPassword}
                     onChange={(e) => setAdminPassword(e.target.value)}
                     required
                   />
                   <button 
                     type="button" 
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-4 bottom-3.5 text-slate-500"
                   >
                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                 </div>

                 <AnimatePresence>
                   {adminError && (
                     <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-black uppercase text-red-500 text-center tracking-wider">
                       {adminError}
                     </motion.p>
                   )}
                 </AnimatePresence>

                 <Button 
                   type="submit" 
                   isLoading={adminLoading} 
                   className="w-full py-4 shadow-2xl" 
                   variant="primary"
                 >
                   Verify & unlock
                 </Button>
               </form>
            </GlassCard>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
