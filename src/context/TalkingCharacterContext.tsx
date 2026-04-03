import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLanguage } from './LanguageContext';

export type CharacterAction = 'idle' | 'talking' | 'waving' | 'pointing' | 'blinking' | 'thinking' | 'explaining' | 'success';

interface TalkingCharacterContextType {
  isSpeaking: boolean;
  speak: (text: string, action?: CharacterAction) => void;
  stop: () => void;
  repeat: () => void;
  action: CharacterAction;
  setAction: (action: CharacterAction) => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  isMuted: boolean;
  toggleMute: () => void;
  currentText: string;
}

const TalkingCharacterContext = createContext<TalkingCharacterContextType | undefined>(undefined);

export function TalkingCharacterProvider({ children }: { children: React.ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [action, setAction] = useState<CharacterAction>('idle');
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [lastText, setLastText] = useState('');
  const { language } = useLanguage();

  const toggleMute = () => setIsMuted(prev => !prev);

  const speak = useCallback((text: string, customAction: CharacterAction = 'talking') => {
    if (isMuted) return;

    setLastText(text);
    setCurrentText(text);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Voice selection logic - Search for "Crystal Clear" High-Quality Female Voices
    const voices = window.speechSynthesis.getVoices();
    
    const findClearVoice = (langCode: string, preferences: string[]) => {
        const langVoices = voices.filter(v => v.lang.includes(langCode));
        // Priority to specific high-quality providers
        for (const pref of preferences) {
            const found = langVoices.find(v => v.name.includes(pref));
            if (found) return found;
        }
        // Fallback to any female voice in that language
        return langVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('microsoft'));
    };

    const hiVoice = findClearVoice('hi-IN', ['Google हिन्दी', 'Heera', 'Kalpana']);
    const enVoice = findClearVoice('en-', ['Google UK English Female', 'Zira', 'Samantha', 'Google US English']);

    if (language === 'hi' && hiVoice) {
      utterance.voice = hiVoice;
    } else if (enVoice) {
      utterance.voice = enVoice;
    }

    // "Crystal Clear" Audio Tuning
    utterance.pitch = 1.1; // Clearer female tone
    utterance.rate = 0.95;  // Slightly more professional and articulate speed
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setAction(customAction);
      setIsVisible(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setAction('idle');
      // Hide text bubble after a short delay
      setTimeout(() => {
        if (!window.speechSynthesis.speaking) {
          setCurrentText('');
        }
      }, 2000);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setAction('idle');
      setCurrentText('');
    };

    window.speechSynthesis.speak(utterance);
  }, [isMuted, language]);

  const repeat = useCallback(() => {
    if (lastText) {
      speak(lastText);
    }
  }, [lastText, speak]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setAction('idle');
    setCurrentText('');
  }, []);

  return (
    <TalkingCharacterContext.Provider 
      value={{ 
        isSpeaking, 
        speak, 
        stop, 
        repeat,
        action, 
        setAction, 
        isVisible, 
        setIsVisible,
        isMuted,
        toggleMute,
        currentText
      }}
    >
      {children}
    </TalkingCharacterContext.Provider>
  );
}

export function useTalkingCharacter() {
  const context = useContext(TalkingCharacterContext);
  if (context === undefined) {
    throw new Error('useTalkingCharacter must be used within a TalkingCharacterProvider');
  }
  return context;
}
