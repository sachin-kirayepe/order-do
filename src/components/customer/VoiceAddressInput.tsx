import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Keyboard, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface VoiceAddressInputProps {
  onAddressSet: (address: string) => void;
  initialValue?: string;
}

// Browser SpeechRecognition type
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function VoiceAddressInput({ onAddressSet, initialValue = '' }: VoiceAddressInputProps) {
  const { t, language } = useLanguage();
  const [address, setAddress] = useState(initialValue);
  const [mode, setMode] = useState<'voice' | 'type'>('voice');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

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
      setAddress(heard);
      onAddressSet(heard);
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

  const handleTyped = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddress(e.target.value);
    onAddressSet(e.target.value);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 w-full">
        <div className="w-12 h-12 rounded-xl bg-kirana-orange/10 flex items-center justify-center shrink-0">
          <MapPin className="text-kirana-orange" size={24} />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">
            {language === 'hi' ? 'आपका पता' : 'Your Address'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi' ? 'डिलीवरी के लिए अपना पता बताएं' : 'Tell us your address for delivery'}
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 w-full max-w-xs">
        <button
          onClick={() => setMode('voice')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'voice' ? 'bg-white dark:bg-slate-700 text-kirana-orange shadow-sm' : 'text-slate-500'}`}
        >
          <Mic size={15} /> {t('customer.speak')}
        </button>
        <button
          onClick={() => setMode('type')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'type' ? 'bg-white dark:bg-slate-700 text-kirana-orange shadow-sm' : 'text-slate-500'}`}
        >
          <Keyboard size={15} /> {t('customer.type')}
        </button>
      </div>

      {mode === 'voice' ? (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={listening ? stopListening : startListening}
            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${
              listening
                ? 'bg-red-500 animate-pulse scale-110'
                : 'bg-kirana-orange hover:bg-orange-600'
            }`}
          >
            {listening ? <MicOff className="w-8 h-8 md:w-10 md:h-10" /> : <Mic className="w-8 h-8 md:w-10 md:h-10" />}
          </button>
          <p className="text-sm text-slate-500">
            {listening ? t('customer.listening') : t('customer.voiceInstruction')}
          </p>
        </div>
      ) : (
        <textarea
          value={address}
          onChange={handleTyped}
          placeholder={language === 'hi' ? 'यहाँ अपना पता लिखें...' : 'Type your address here...'}
          className="w-full max-w-xs border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-center text-lg dark:bg-slate-900 dark:text-white focus:border-kirana-orange focus:outline-none transition-colors min-h-[100px]"
          autoFocus
        />
      )}

      {address && (
        <div className="text-center bg-orange-50 dark:bg-slate-800 px-6 py-3 rounded-xl border border-kirana-orange/30 w-full max-w-xs">
          <p className="text-xs text-slate-500 mb-1 font-bold uppercase tracking-wider">
            {language === 'hi' ? 'लिखा गया पता' : 'Entered Address'}
          </p>
          <p className="text-md font-semibold text-slate-700 dark:text-slate-200">{address}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center max-w-xs">{error}</p>}
    </div>
  );
}
