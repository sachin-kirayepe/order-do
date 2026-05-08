import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Sparkles, UserPlus, Zap, ArrowRight, ShieldCheck, ArrowLeft, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/ui/GlassCard';

export default function Register() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (otpCooldown > 0) return;
    
    setLoading(true); setError(''); setMessage('');
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    
    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
      setMessage('OTP sent successfully to your mobile');
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
    
    if (error) {
      setError(error.message);
    } else if (data.session?.user) {
      setMessage('Verified successfully!');
      // Check if user already has a shop profile
      const { data: roleData } = await supabase.from('shops_profile').select('shop_id').eq('id', data.session.user.id).single();
      
      if (roleData?.shop_id) {
        navigate('/shop/dashboard');
      } else {
        navigate('/shop/setup');
      }
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
                label="Verification Code (OTP)" 
                type="text" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                placeholder="X X X X X X"
                className="bg-white/10 border-white/10 focus:border-brand-primary transition-all text-center text-lg font-black tracking-[1em]"
                labelClassName="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1 text-center"
              />
            )}

            <div className="pt-2 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                By initializing, you agree to our{' '}
                <Link to="/legal/terms" className="text-brand-secondary hover:underline underline-offset-4 decoration-brand-secondary/30">Terms</Link>
                {' '}and{' '}
                <Link to="/legal/privacy" className="text-brand-primary hover:underline underline-offset-4 decoration-brand-primary/30">Privacy</Link>
              </p>
            </div>

            <div className="pt-4">
              {!otpSent ? (
                <Button 
                  className="w-full h-16 !rounded-2xl shadow-glow-green text-sm font-black uppercase tracking-widest italic group" 
                  onClick={handleSendOTP} 
                  isLoading={loading}
                >
                  Send OTP
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button 
                    className="w-full h-16 !rounded-2xl shadow-glow-green text-sm font-black uppercase tracking-widest italic group" 
                    onClick={handleVerifyOTP} 
                    isLoading={loading}
                  >
                    Verify & Create Shop
                    <Shield size={18} className="ml-2" />
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
