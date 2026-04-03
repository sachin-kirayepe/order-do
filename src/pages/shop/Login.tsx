import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';

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

  const handleSendMagicLink = async () => {
    setLoading(true); setError(''); setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (error) setError(error.message);
    else setMessage(t('auth.magicLinkSent'));
    setLoading(false);
  };

  const handleSendOTP = async () => {
    setLoading(true); setError(''); setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(error.message);
    else {
      setOtpSent(true);
      setMessage(t('auth.otpSent'));
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setLoading(true); setError('');
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) setError(error.message);
    else navigate('/shop/dashboard');
    setLoading(false);
  };

  const handlePasswordLogin = async () => {
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate('/shop/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-10 dark:opacity-5 mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'url("/assets/bg-kirana.png")' }}
      />

      <div className="absolute top-4 right-4 flex gap-3 z-20 items-center">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full glass-panel p-8 rounded-2xl relative z-10 border border-white/20">

        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-6 uppercase tracking-tight">{t('auth.loginTitle')}</h2>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-6">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'magic' ? 'bg-white text-kirana-green shadow-sm dark:bg-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            onClick={() => { setTab('magic'); setOtpSent(false); setError(''); setMessage(''); }}
          >{t('auth.magicLink')}</button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'otp' ? 'bg-white text-kirana-green shadow-sm dark:bg-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            onClick={() => { setTab('otp'); setError(''); setMessage(''); }}
          >{t('auth.emailOtp')}</button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'password' ? 'bg-white text-kirana-green shadow-sm dark:bg-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            onClick={() => { setTab('password'); setOtpSent(false); setError(''); setMessage(''); }}
          >{t('auth.password')}</button>
        </div>

        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200">{error}</div>}
        {message && <div className="p-3 mb-4 text-sm text-kirana-dark bg-kirana-light rounded-lg border border-kirana-green/30">{message}</div>}

        <div className="space-y-4">
          <Input 
            label={t('auth.emailLabel')} 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            icon={<Mail size={18} />} 
            placeholder="dukaan@example.com"
          />

          {tab === 'password' && (
            <Input 
              label={t('auth.passwordLabel')} 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              icon={<KeyRound size={18} />} 
              placeholder="••••••••"
            />
          )}

          {tab === 'otp' && otpSent && (
            <Input 
              label={t('auth.otpLabel')} 
              type="text" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              placeholder="123456"
            />
          )}

          <div className="pt-2">
            {tab === 'magic' && (
               <Button className="w-full" onClick={handleSendMagicLink} isLoading={loading}>{t('auth.sendLink')}</Button>
            )}
            {tab === 'password' && (
               <Button className="w-full" onClick={handlePasswordLogin} isLoading={loading}>{t('auth.loginBtn')}</Button>
            )}
            {tab === 'otp' && !otpSent && (
               <Button className="w-full" onClick={handleSendOTP} isLoading={loading}>{t('auth.sendOtp')}</Button>
            )}
            {tab === 'otp' && otpSent && (
               <Button className="w-full" onClick={handleVerifyOTP} isLoading={loading}>{t('auth.verifyOtp')}</Button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('auth.noAccount')}{' '}
          <Link to="/shop/register" className="font-medium text-kirana-green hover:underline">{t('auth.registerBtn')}</Link>
        </p>



        {user && isAdmin && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
             <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-kirana-orange to-amber-600 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              <Shield size={18} />
              {t('dashboard.adminPanel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
