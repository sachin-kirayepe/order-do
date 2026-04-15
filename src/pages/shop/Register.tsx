import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Eye, EyeOff, Sparkles, UserPlus, Zap, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/ui/GlassCard';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    // TC-022 FIX: Password strength validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    setLoading(true); setError(''); setMessage('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setMessage(t('auth.registerSuccess'));
      setTimeout(() => navigate('/shop/setup'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
      {/* Immersive Background Nodes */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand-primary/10 blur-[120px] rounded-full -ml-40 -mt-40 animate-pulse-slow" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-secondary/10 blur-[120px] rounded-full -mr-40 -mb-40 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-[0.03] pointer-events-none" />

      <div className="absolute top-6 right-6 flex gap-4 z-50 items-center">
        <LanguageSwitcher />
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="h-10 px-4 !rounded-xl bg-white/5 text-slate-400 group"
        >
           <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> {t('common.home')}
        </Button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-md w-full relative z-10"
      >
        <GlassCard intensity="high" className="p-10 border-white/20 dark:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-10 space-y-4">
             <div className="w-20 h-20 bg-brand-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-brand-primary/20 shadow-glow-green/10">
                <UserPlus className="text-brand-primary" size={40} />
             </div>
             <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                  {t('auth.registerTitle')}
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Initializing Nexus Node</p>
                <p className="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  {language === 'hi' ? 'अपना ऑनलाइन स्टोर अभी शुरू करें' : 'Launch your online store in seconds'}
                </p>
             </div>
          </div>
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 mb-6 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"
              >
                 <Zap size={14} /> {error}
              </motion.div>
            )}
            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 mb-6 text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center gap-3"
              >
                 <Sparkles size={14} /> {message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <Input 
              label="Transmission ID (Email)" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              icon={<Mail size={18} className="text-brand-primary" />} 
              placeholder="nexus@hub.com"
              className="bg-white/10 border-white/10 focus:border-brand-primary transition-all text-xs font-bold tracking-widest"
              labelClassName="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1"
            />

            <Input 
              label="Access Secret (Password)" 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              icon={<KeyRound size={18} className="text-brand-primary" />} 
              placeholder="••••••••"
              className="bg-white/10 border-white/10 focus:border-brand-primary transition-all text-xs font-bold tracking-widest"
              labelClassName="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1"
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none text-slate-500 hover:text-brand-primary transition-colors pr-4"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <div className="pt-2 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                By initializing, you agree to our{' '}
                <Link to="/legal/terms" className="text-brand-secondary hover:underline underline-offset-4 decoration-brand-secondary/30">Terms</Link>
                {' '}and{' '}
                <Link to="/legal/privacy" className="text-brand-primary hover:underline underline-offset-4 decoration-brand-primary/30">Privacy</Link>
              </p>
            </div>

            <div className="pt-4">
              <Button 
                className="w-full h-16 !rounded-2xl shadow-glow-green text-sm font-black uppercase tracking-widest italic group" 
                onClick={handleRegister} 
                isLoading={loading}
              >
                {t('auth.registerBtn')} 
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          <p className="mt-10 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {t('auth.hasAccount')}{' '}
            <Link to="/shop/login" className="text-brand-primary hover:text-brand-primary/80 transition-colors ml-2 underline decoration-brand-primary/20 hover:decoration-brand-primary underline-offset-4">
               {t('auth.loginBtn')}
            </Link>
          </p>
        </GlassCard>
        
        <div className="mt-8 flex items-center justify-center gap-4 opacity-20 group hover:opacity-100 transition-opacity">
           <ShieldCheck size={14} className="text-brand-primary" />
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Securing your digital commerce identity</p>
           <ShieldCheck size={14} className="text-brand-primary" />
        </div>
      </motion.div>
    </div>
  );
}
