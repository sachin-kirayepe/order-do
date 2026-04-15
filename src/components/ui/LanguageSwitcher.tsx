import { useLanguage } from '../../context/LanguageContext';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-kirana-green/10 hover:text-kirana-green transition-all shadow-sm active:scale-95"
    >
      <Languages size={18} />
      <span className="text-xs uppercase tracking-wider">{language === 'hi' ? 'English' : 'हिंदी'}</span>
    </button>
  );
}
