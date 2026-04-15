import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Shield, Eye, EyeOff, Sparkles, Fingerprint, Lock, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/ui/GlassCard';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [tab, setTab] = useState<'magic' | 'otp' | 'password'>('magic');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAdmin, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  // TC-021 FIX: OTP cooldown state
  const [otpCooldown, setOtpCooldown] = useState(0);

  // TC-021: Cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  // TC-031 FIX: Auto-redirect admin on auth state change (magic link flow)
  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin');
    } else if (user && !isAdmin) {
      navigate('/shop/dashboard');
    }
  }, [user, isAdmin, navigate]);

  const handleSendMagicLink = async () => {
    if (otpCooldown > 0) return;
    setLoading(true); setError(''); setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (error) setError(error.message);
    else {
      setMessage(t('auth.magicLinkSent'));
      setOtpCooldown(60); // TC-021: 60 second cooldown
    }
    setLoading(false);
  };

  const handleSendOTP = async () => {
    if (otpCooldown > 0) return;
    setLoading(true); setError(''); setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(error.message);
    else {
      setOtpSent(true);
      setMessage(t('auth.otpSent'));
      setOtpCooldown(60); // TC-021: 60 second cooldown
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setLoading(true); setError('');
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) setError(error.message);
    else if (data.session?.user) {
      const { data: roleData } = await supabase.from('shops_profile').select('role').eq('id', data.session.user.id).single();
      if (roleData?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/shop/dashboard');
      }
    }
    setLoading(false);
  };

  const handlePasswordLogin = async () => {
    setLoading(true); setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else if (data.user) {
      const { data: roleData } = await supabase.from('shops_profile').select('role').eq('id', data.user.id).single();
      if (roleData?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/shop/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
      {/* Immersive Background Nodes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/10 blur-[120px] rounded-full -mr-40 -mt-40 animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/10 blur-[120px] rounded-full -ml-40 -mb-40 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

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
                <Lock className="text-brand-primary" size={40} />
             </div>
             <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                  {t('auth.loginTitle')}
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Nexus Authorization Protocol</p>
             </div>
          </div>
          
          <div className="flex p-1.5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl shadow-inner mb-8">
            <button 
              className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'magic' ? 'bg-brand-primary text-white shadow-glow-green' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              onClick={() => { setTab('magic'); setOtpSent(false); setError(''); setMessage(''); }}
            >Link</button>
            <button 
              className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'otp' ? 'bg-brand-primary text-white shadow-glow-green' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              onClick={() => { setTab('otp'); setError(''); setMessage(''); }}
            >OTP</button>
            <button 
              className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'password' ? 'bg-brand-primary text-white shadow-glow-green' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              onClick={() => { setTab('password'); setOtpSent(false); setError(''); setMessage(''); }}
            >Key</button>
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

            {tab === 'password' && (
              <Input 
                label="Authorization Key" 
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
            )}

            {tab === 'otp' && otpSent && (
              <Input 
                label="Verification Code" 
                type="text" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                placeholder="X X X X X X"
                className="bg-white/10 border-white/10 focus:border-brand-primary transition-all text-center text-lg font-black tracking-[1em]"
                labelClassName="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1 text-center"
              />
            )}

            <div className="pt-4">
              {tab === 'magic' && (
                 <Button className="w-full h-16 !rounded-2xl shadow-glow-green text-sm font-black uppercase tracking-widest italic" onClick={handleSendMagicLink} isLoading={loading}>
                   {t('auth.sendLink')} <ArrowRight size={18} className="ml-2" />
                 </Button>
              )}
              {tab === 'password' && (
                 <Button className="w-full h-16 !rounded-2xl shadow-glow-green text-sm font-black uppercase tracking-widest italic" onClick={handlePasswordLogin} isLoading={loading}>
                   {t('auth.loginBtn')} <Fingerprint size={18} className="ml-2" />
                 </Button>
              )}
              {tab === 'otp' && !otpSent && (
                 <Button className="w-full h-16 !rounded-2xl shadow-glow-green text-sm font-black uppercase tracking-widest italic" onClick={handleSendOTP} isLoading={loading}>
                   {t('auth.sendOtp')} <Zap size={18} className="ml-2" />
                 </Button>
              )}
              {tab === 'otp' && otpSent && (
                 <Button className="w-full h-16 !rounded-2xl shadow-glow-green text-sm font-black uppercase tracking-widest italic" onClick={handleVerifyOTP} isLoading={loading}>
                   {t('auth.verifyOtp')} <Shield size={18} className="ml-2" />
                 </Button>
              )}
            </div>
          </div>

          <p className="mt-10 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {t('auth.noAccount')}{' '}
            <Link to="/shop/register" className="text-brand-primary hover:text-brand-primary/80 transition-colors ml-2 underline decoration-brand-primary/20 hover:decoration-brand-primary underline-offset-4">
               {t('auth.registerBtn')}
            </Link>
          </p>

          {user && isAdmin && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="mt-10 pt-8 border-t border-white/10"
            >
               <Button
                onClick={() => navigate('/admin')}
                variant="ghost"
                className="w-full py-4 bg-white/5 border border-white/10 text-brand-secondary !rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 group"
              >
                <Shield size={18} className="group-hover:rotate-12 transition-transform" />
                Control Nexus [ADMIN]
              </Button>
            </motion.div>
          )}
        </GlassCard>
        
        <div className="mt-8 flex items-center justify-center gap-4 opacity-20 group hover:opacity-100 transition-opacity">
           <Zap size={14} className="text-brand-primary" />
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">End-to-End Encrypted Node Authorization</p>
           <Zap size={14} className="text-brand-primary" />
        </div>
      </motion.div>
    </div>
  );
}
