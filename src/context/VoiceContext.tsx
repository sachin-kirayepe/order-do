import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { VOICE_VOCABULARY, type VoiceRegion } from '../constants/voiceVocabulary';

export const VOICE_REGIONS = [
  { id: 'neutral', label: 'Hindi (Standard)', emoji: '📖' },
  { id: 'marathi', label: 'Marathi (Maharashtra)', emoji: '⛰️' },
  { id: 'english', label: 'English (US/UK)', emoji: '🌐' },
] as const;

// ─── Default voice tone values ──────────────────────────────────────────
export const VOICE_DEFAULTS = {
  pitch: 1.12,   // Sweet feminine lift without distortion
  rate: 0.93,    // Natural conversational pace
  volume: 1.0,   // Full volume
};

// ─── Voice customization presets ────────────────────────────────────────
export const VOICE_PRESETS = [
  { id: 'cute', label: 'Cute Pyaari 🎀', pitch: 1.25, rate: 0.90, volume: 1.0 },
  { id: 'natural', label: 'Natural Sweet 🌸', pitch: 1.12, rate: 0.93, volume: 1.0 },
  { id: 'calm', label: 'Calm Soothing 🍃', pitch: 1.05, rate: 0.85, volume: 0.9 },
  { id: 'energetic', label: 'Energetic Fun ⚡', pitch: 1.20, rate: 1.05, volume: 1.0 },
  { id: 'deep', label: 'Deep Mature 🌙', pitch: 0.95, rate: 0.88, volume: 1.0 },
] as const;

export type VoicePresetId = typeof VOICE_PRESETS[number]['id'] | 'custom';

interface VoiceContextType {
  speak: (textOrKey: string | ((v: typeof VOICE_VOCABULARY['neutral']) => string)) => void;
  stop: () => void;
  repeatLast: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isSpeaking: boolean;
  region: VoiceRegion;
  setRegion: (region: VoiceRegion) => void;
  announceOrder: (customerName: string, items: { name: string; quantity: string }[], shortId: string, type?: string, no?: string) => void;
  // Voice customization
  voicePitch: number;
  voiceRate: number;
  voiceVolume: number;
  setVoicePitch: (v: number) => void;
  setVoiceRate: (v: number) => void;
  setVoiceVolume: (v: number) => void;
  activePreset: VoicePresetId;
  applyPreset: (presetId: VoicePresetId) => void;
  resetToDefaults: () => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  setSelectedVoiceName: (name: string) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

// ─── Crystal-Clear Indian Female Voice Selection Engine ─────────────────

const MALE_VOICE_KEYWORDS = ['male', 'david', 'mark', 'ravi', 'hemant', 'heera', 'prabhat', 'madhur', 'guy', 'boy', 'man'];
const QUALITY_TAGS = ['online', 'neural', 'natural', 'enhanced', 'premium'];

const KNOWN_HINDI_FEMALE = [
  'microsoft swara online', 'microsoft swara',
  'google hindi', 'google हिन्दी',
  'lekha', 'hindi female', 'hi-in female',
];

const KNOWN_MARATHI_FEMALE = [
  'microsoft bhakti online', 'microsoft bhakti',
  'google marathi', 'google मराठी',
  'महाराष्ट्र', 'hemlata', 'marathi female', 'mr-in female',
];

const KNOWN_ENGLISH_FEMALE = [
  'microsoft neerja online', 'microsoft neerja',
  'jenny online', 'jenny', 'aria online', 'aria',
  'google us english', 'google uk english female',
  'samantha', 'karen', 'moira', 'zira',
];

function selectBestVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const isHindi = lang.startsWith('hi');
  const isMarathi = lang.startsWith('mr');
  
  let knownList = KNOWN_ENGLISH_FEMALE;
  if (isHindi) knownList = KNOWN_HINDI_FEMALE;
  else if (isMarathi) knownList = KNOWN_MARATHI_FEMALE;

  const langPrefix = lang.split('-')[0];

  const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
  const pool = langVoices.length > 0 ? langVoices : voices;
  const candidates = pool.filter(v => 
    !MALE_VOICE_KEYWORDS.some(k => v.name.toLowerCase().includes(k))
  );

  for (const name of knownList) {
    const match = candidates.find(v => v.name.toLowerCase().includes(name));
    if (match) return match;
  }

  for (const tag of QUALITY_TAGS) {
    const match = candidates.find(v => v.name.toLowerCase().includes(tag));
    if (match) return match;
  }

  const femaleVoice = candidates.find(v => 
    ['female', 'woman', 'girl'].some(k => v.name.toLowerCase().includes(k))
  );
  if (femaleVoice) return femaleVoice;

  const brandVoice = candidates.find(v =>
    ['google', 'microsoft'].some(k => v.name.toLowerCase().includes(k))
  );
  if (brandVoice) return brandVoice;

  return candidates[0] || pool[0] || null;
}

// ─── localStorage helpers ───────────────────────────────────────────────

function loadNumber(key: string, fallback: number): number {
  const val = localStorage.getItem(key);
  if (val === null) return fallback;
  const num = parseFloat(val);
  return isNaN(num) ? fallback : num;
}

// ─── Voice Provider ───────────────────────────────────────────────────

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('voice_muted') === 'true';
  });
  const [region, setRegionState] = useState<VoiceRegion>(() => {
    return (localStorage.getItem('voice_region') as VoiceRegion) || 'neutral';
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastTextRef = useRef<string>('');
  
  // ─── Custom voice tone state ────────────────────────────────────────
  const [voicePitch, setVoicePitchState] = useState(() => loadNumber('voice_pitch', VOICE_DEFAULTS.pitch));
  const [voiceRate, setVoiceRateState] = useState(() => loadNumber('voice_rate', VOICE_DEFAULTS.rate));
  const [voiceVolume, setVoiceVolumeState] = useState(() => loadNumber('voice_volume', VOICE_DEFAULTS.volume));
  const [activePreset, setActivePreset] = useState<VoicePresetId>(() => {
    return (localStorage.getItem('voice_preset') as VoicePresetId) || 'natural';
  });
  const [selectedVoiceName, setSelectedVoiceNameState] = useState(() => {
    return localStorage.getItem('voice_selected_name') || '';
  });

  const synth = window.speechSynthesis;
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const loadVoices = useCallback(() => {
    const v = synth.getVoices();
    voicesRef.current = v;
    setAvailableVoices(v);
  }, [synth]);

  useEffect(() => {
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }, [synth, loadVoices]);

  // ─── Setters with localStorage persistence ──────────────────────────
  const setVoicePitch = (v: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, v));
    setVoicePitchState(clamped);
    localStorage.setItem('voice_pitch', String(clamped));
    setActivePreset('custom');
    localStorage.setItem('voice_preset', 'custom');
  };

  const setVoiceRate = (v: number) => {
    const clamped = Math.max(0.3, Math.min(2.0, v));
    setVoiceRateState(clamped);
    localStorage.setItem('voice_rate', String(clamped));
    setActivePreset('custom');
    localStorage.setItem('voice_preset', 'custom');
  };

  const setVoiceVolume = (v: number) => {
    const clamped = Math.max(0.0, Math.min(1.0, v));
    setVoiceVolumeState(clamped);
    localStorage.setItem('voice_volume', String(clamped));
  };

  const setSelectedVoiceName = (name: string) => {
    setSelectedVoiceNameState(name);
    localStorage.setItem('voice_selected_name', name);
  };

  const applyPreset = (presetId: VoicePresetId) => {
    const preset = VOICE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setVoicePitchState(preset.pitch);
      setVoiceRateState(preset.rate);
      setVoiceVolumeState(preset.volume);
      localStorage.setItem('voice_pitch', String(preset.pitch));
      localStorage.setItem('voice_rate', String(preset.rate));
      localStorage.setItem('voice_volume', String(preset.volume));
    }
    setActivePreset(presetId);
    localStorage.setItem('voice_preset', presetId);
  };

  const resetToDefaults = () => {
    applyPreset('natural');
    setSelectedVoiceName('');
  };

  const setRegion = (newRegion: VoiceRegion) => {
    setRegionState(newRegion);
    localStorage.setItem('voice_region', newRegion);
  };

  const setMuted = (muted: boolean) => {
    setIsMuted(muted);
    localStorage.setItem('voice_muted', String(muted));
    if (muted) synth.cancel();
  };

  // ─── Core speak function — uses custom tone values ────────────────
  const speakText = useCallback((text: string) => {
    try {
      if (!text || !('speechSynthesis' in window)) return;

      synth.cancel();

      const isDevanagari = /[\u0900-\u097F]/.test(text);
      let lang = 'en-US';
      
      if ((region as string) === 'marathi' || (isDevanagari && (region as string) === 'marathi')) {
        lang = 'mr-IN';
      } else if (region === 'neutral' || isDevanagari) {
        lang = 'hi-IN';
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      
      // Use custom tone values from user settings
      utterance.pitch = voicePitch;
      utterance.rate = voiceRate;
      utterance.volume = voiceVolume;

      // Use manually selected voice if set, otherwise auto-select
      if (selectedVoiceName) {
        const manualVoice = voicesRef.current.find(v => v.name === selectedVoiceName);
        if (manualVoice) {
          utterance.voice = manualVoice;
        } else {
          const voice = selectBestVoice(voicesRef.current, lang);
          if (voice) utterance.voice = voice;
        }
      } else {
        const voice = selectBestVoice(voicesRef.current, lang);
        if (voice) utterance.voice = voice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synth.speak(utterance);
    } catch (err) {
      console.warn('[Voice] Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  }, [synth, region, voicePitch, voiceRate, voiceVolume, selectedVoiceName]);

  // ─── Public speak function ────────────────────────────────────────
  const speak = useCallback((textOrKeyOrFn: string | ((v: any) => string)) => {
    if (isMuted) return;
    
    let text = '';
    const vocab = VOICE_VOCABULARY[region];
    
    if (typeof textOrKeyOrFn === 'function') {
      text = textOrKeyOrFn(vocab);
    } else if (typeof textOrKeyOrFn === 'string' && (vocab as any)[textOrKeyOrFn]) {
      text = (vocab as any)[textOrKeyOrFn];
    } else {
      text = textOrKeyOrFn as string;
    }

    if (!text) return;
    lastTextRef.current = text;
    speakText(text);
  }, [isMuted, region, speakText]);

  // ─── Order announcement using regional vocabulary ─────────────────
  const announceOrder = useCallback((
    customerName: string, 
    items: { name: string; quantity: string }[], 
    shortId: string,
    type?: string, 
    no?: string
  ) => {
    if (isMuted) return;

    const vocab = VOICE_VOCABULARY[region];
    
    let locationStr = 'counter';
    if (type === 'counter' && no) locationStr = `Counter ${no}`;
    else if (type === 'table' && no) locationStr = `Table ${no}`;

    const phrase = vocab.ORDER_ALERT_SHOP(customerName, locationStr, shortId);

    const itemStr = items.map((i) => `${i.quantity} ${i.name}`).join(', ');
    
    let fullText = '';
    if (region === 'marathi') {
      fullText = `${phrase} यामध्ये समाविष्ट आहे: ${itemStr}.`;
    } else if (region === 'neutral') {
      fullText = `${phrase} इसमें शामिल हैं: ${itemStr}.`;
    } else {
      fullText = `${phrase} Items included: ${itemStr}.`;
    }

    lastTextRef.current = fullText;
    speakText(fullText);
  }, [isMuted, region, speakText]);

  const stop = useCallback(() => {
    synth.cancel();
    setIsSpeaking(false);
  }, [synth]);

  const repeatLast = useCallback(() => {
    if (lastTextRef.current && !isMuted) {
      speakText(lastTextRef.current);
    }
  }, [speakText, isMuted]);

  return (
    <VoiceContext.Provider value={{ 
      speak, 
      stop, 
      repeatLast, 
      isMuted, 
      setIsMuted: setMuted, 
      isSpeaking, 
      region, 
      setRegion,
      announceOrder,
      // Voice customization
      voicePitch,
      voiceRate,
      voiceVolume,
      setVoicePitch,
      setVoiceRate,
      setVoiceVolume,
      activePreset,
      applyPreset,
      resetToDefaults,
      availableVoices,
      selectedVoiceName,
      setSelectedVoiceName,
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
