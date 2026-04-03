import { useEffect, useState } from 'react';
import { WifiOff, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function OfflineBanner() {
  const { t } = useLanguage();
  const [offline, setOffline] = useState(!navigator.onLine);
  const [insecure, setInsecure] = useState(false);

  useEffect(() => {
    // Check for secure context (HTTPS)
    // Localhost is usually considered secure by browsers, so we check for production
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setInsecure(true);
    }

    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col gap-0 pointer-events-none">
      <AnimatePresence>
        {offline && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 shadow-lg pointer-events-auto"
          >
            <WifiOff size={16} />
            {t('common.offline')}
          </motion.div>
        )}
        {insecure && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="bg-red-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 shadow-lg pointer-events-auto"
          >
            <ShieldAlert size={16} />
            {t('common.httpsWarning')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
