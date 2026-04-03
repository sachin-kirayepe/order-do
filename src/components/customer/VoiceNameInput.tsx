import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Keyboard, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import db from '../../db/dexie';
import { decrypt } from '../../utils/encryption';
import { toast } from 'sonner';

interface VoiceNameInputProps {
  onNameSet: (name: string) => void;
}

// Browser SpeechRecognition type
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function VoiceNameInput({ onNameSet }: VoiceNameInputProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'voice' | 'type'>('voice');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const checkHistory = async (enteredName: string) => {
    if (!enteredName || enteredName.length < 2) return;
    try {
      const history = await db.orderHistory.limit(100).toArray();
      const match = history.find(h => {
        try {
          return decrypt(h.customerName).toLowerCase() === enteredName.toLowerCase();
        } catch { return false; }
      });
      if (match) {
        setIsReturning(true);
        toast.success(`Namaste! Welcome back, ${enteredName}!`, {
          icon: <Star className="text-yellow-500 fill-yellow-500" size={16} />,
          duration: 3000
        });
      } else {
        setIsReturning(false);
      }
    } catch (err) {
      console.error('History check failed:', err);
    }
  };

  const startListening = () => {
    if (!SpeechRecognition) {
      setError(t('customer.voiceNotSupported'));
      setMode('type');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'hi-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onresult = (event: any) => {
      const heard = event.results[0][0].transcript;
      setName(heard);
      onNameSet(heard);
      checkHistory(heard);
      setListening(false);
    };
    rec.onerror = () => {
      setError(t('customer.voiceTryAgain'));
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleTyped = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    onNameSet(val);
    if (val.length > 2) checkHistory(val);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">
        {t('customer.step2Title')}
      </h2>

      {/* Mode Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 w-full max-w-xs">
        <button
          onClick={() => setMode('voice')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'voice' ? 'bg-white dark:bg-slate-700 text-kirana-green shadow-sm' : 'text-slate-500'}`}
        >
          <Mic size={15} /> {t('customer.speak')}
        </button>
        <button
          onClick={() => setMode('type')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'type' ? 'bg-white dark:bg-slate-700 text-kirana-green shadow-sm' : 'text-slate-500'}`}
        >
          <Keyboard size={15} /> {t('customer.type')}
        </button>
      </div>

      {mode === 'voice' ? (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={listening ? stopListening : startListening}
            className={`w-28 h-28 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${
              listening
                ? 'bg-red-500 animate-pulse scale-110'
                : 'bg-kirana-green hover:bg-kirana-dark'
            }`}
          >
            {listening ? <MicOff size={44} /> : <Mic size={44} />}
          </button>
          <p className="text-sm text-slate-500">
            {listening ? t('customer.listening') : t('customer.voiceInstruction')}
          </p>
        </div>
      ) : (
        <input
          type="text"
          value={name}
          onChange={handleTyped}
          placeholder={t('customer.namePlaceholder')}
          className="w-full max-w-xs border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-center text-lg dark:bg-slate-900 dark:text-white focus:border-kirana-green focus:outline-none transition-colors"
          autoFocus
        />
      )}

      {name && (
        <div className="text-center bg-kirana-light dark:bg-slate-800 px-6 py-3 rounded-xl border border-kirana-green/30 relative">
          {isReturning && (
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-3 -right-3 bg-yellow-400 text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-slate-800"
              title="Returning Customer"
            >
              <Star size={14} fill="currentColor" />
            </motion.div>
          )}
          <p className="text-xs text-slate-500 mb-1">
            {isReturning ? 'Welcome Back!' : t('customer.yourNameLabel')}
          </p>
          <p className="text-xl font-bold text-kirana-green">{name}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center max-w-xs">{error}</p>}
    </div>
  );
}
