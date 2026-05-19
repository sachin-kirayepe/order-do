import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Shield, Eye, EyeOff, Sparkles, Fingerprint, Lock, Zap, ArrowLeft, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/ui/GlassCard';

export default function Login() {
  const [tab, setTab] = useState<'phone' | 'email' | 'admin'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAdmin, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin');
    } else if (user && !isAdmin) {
      navigate('/shop/dashboard');
    }
  }, [user, isAdmin, navigate]);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (otpCooldown > 0) return;
    
    setLoading(true); setError(''); setMessage('');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    if (error) setError(error.message);
    else {
      setOtpSent(true);
      setMessage(t('auth.otpSent') || 'OTP sent successfully');
      setOtpCooldown(60);
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true); setError('');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const { data, error } = await supabase.auth.verifyOtp({ phone: formattedPhone, token: otp, type: 'sms' });
    if (error) setError(error.message);
    else if (data.session?.user) {
      const { data: roleData } = await supabase.from('shops_profile').select('role, shop_id').eq('id', data.session.user.id).single();
      if (roleData?.role === 'admin') {
        navigate('/admin');
      } else if (roleData?.shop_id) {
        navigate('/shop/dashboard');
      } else {
        navigate('/shop/setup');
      }
    }
    setLoading(false);
  };

  const handleEmailLogin = async () => {
    if (!email) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true); setError(''); setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(error.message);
    else setMessage('Magic link sent! Check your inbox.');
    setLoading(false);
  };

  const handlePasswordLogin = async () => {
    setLoading(true); setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else if (data.user) {
      const { data: roleData } = await supabase.from('shops_profile').select('role, shop_id').eq('id', data.user.id).single();
      if (roleData?.role === 'admin') {
        navigate('/admin');
      } else {
        setError('Not authorized for Admin access');
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
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
              className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'phone' ? 'bg-brand-primary text-white shadow-glow-green' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              onClick={() => { setTab('phone'); setOtpSent(false); setError(''); setMessage(''); }}
            >Phone</button>
            <button 
              className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'email' ? 'bg-brand-primary text-white shadow-glow-green' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              onClick={() => { setTab('email'); setError(''); setMessage(''); }}
            >Email</button>
            <button 
              className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'admin' ? 'bg-brand-primary text-white shadow-glow-green' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              onClick={() => { setTab('admin'); setError(''); setMessage(''); }}
            >Admin</button>
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
            {tab === 'phone' && (
              <>
                <Input 
                  label="Mobile Number" 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  icon={<Phone size={18} className="text-brand-primary" />} 
                  placeholder="9876543210"
                  disabled={otpSent}
                  className="bg-white/10 border-white/10 focus:border-brand-primary transition-all text-xs font-bold tracking-widest"
                  labelClassName="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1"
                />

                {otpSent && (
                  <Input 
                    label="Verification Code" 
                    type="text" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    placeholder="X X X X X X"
                    className="bg-white/10 border-white/10 focus:border-brand-primary transition-all text-center text-lg font-black tracking-[1em]"
                    labelClassName="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1 text-center"
                  />
                )}
              </>
            )}

            {tab === 'email' && (
              <Input 
                label="Email Address" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                icon={<Mail size={18} className="text-brand-primary" />} 
                placeholder="shop@nexus.com"
                className="bg-white/10 border-white/10 focus:border-brand-primary transition-all text-xs font-bold tracking-widest"
                labelClassName="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1"
              />
            )}

            {tab === 'admin' && (
              <>
                <Input 
                  label="Admin Email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  icon={<Mail size={18} className="text-brand-primary" />} 
                  placeholder="nexus@hub.com"
                  className="bg-white/10 border-white/10 focus:border-brand-primary transition-all text-xs font-bold tracking-widest"
                  labelClassName="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1"
                />
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
              </>
            )}

            <div className="pt-4">
              {tab === 'admin' && (
                 <Button className="w-full h-16 !rounded-2xl shadow-glow-green text-sm font-black uppercase tracking-widest italic group" onClick={handlePasswordLogin} isLoading={loading}>
                   {t('auth.loginBtn')} <Fingerprint size={18} className="ml-2 group-hover:scale-110 transition-transform" />
                 </Button>
              )}
              {tab === 'phone' && !otpSent && (
                 <Button className="w-full h-16 !rounded-2xl shadow-glow-green text-sm font-black uppercase tracking-widest italic group" onClick={handleSendOTP} isLoading={loading}>
                   {t('auth.sendOtp')} <Zap size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                 </Button>
              )}
              {tab === 'phone' && otpSent && (
                 <div className="flex flex-col gap-3">
                   <Button className="w-full h-16 !rounded-2xl shadow-glow-green text-sm font-black uppercase tracking-widest italic group" onClick={handleVerifyOTP} isLoading={loading}>
                     {t('auth.verifyOtp')} <Shield size={18} className="ml-2" />
                   </Button>
                   <Button 
                      variant="ghost" 
                      className="w-full h-12 !rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white"
                      onClick={handleSendOTP}
                      disabled={otpCooldown > 0 || loading}
                    >
                      {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Resend OTP'}
                    </Button>
                 </div>
              )}
              {tab === 'email' && (
                 <Button className="w-full h-16 !rounded-2xl shadow-glow-green text-sm font-black uppercase tracking-widest italic group" onClick={handleEmailLogin} isLoading={loading}>
                   Send Magic Link <Sparkles size={18} className="ml-2 group-hover:scale-110 transition-transform" />
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
