import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const handleRegister = async () => {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl">
        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2 uppercase tracking-tight">{t('auth.registerTitle')}</h2>
        <p className="text-center text-slate-500 mb-6 text-sm">
          {language === 'hi' ? 'अकाउंट बनाएं और ऑनलाइन ऑर्डर प्राप्त करें' : 'Create account and receive online orders'}
        </p>
        
        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
        {message && <div className="p-3 mb-4 text-sm text-kirana-dark bg-kirana-light rounded-lg border border-kirana-green/30">{message}</div>}

        <div className="space-y-4">
          <Input label={t('auth.emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} placeholder="dukaan@example.com" />
          <Input label={t('auth.passwordLabel')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<KeyRound size={18} />} placeholder="••••••••" />
          <div className="pt-4">
            <Button className="w-full" onClick={handleRegister} isLoading={loading}>{t('auth.registerBtn')}</Button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('auth.hasAccount')}{' '}
          <Link to="/shop/login" className="font-medium text-kirana-green hover:underline">{t('auth.loginBtn')}</Link>
        </p>
      </div>
    </div>
  );
}
