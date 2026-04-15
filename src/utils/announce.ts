/**
 * VoiceInstructor — Lightweight standalone utility for voice announcements
 * Crystal-clear, natural Indian female voice — zero robotic artifacts
 * Mirrors VoiceContext voice engine for consistent output
 */

import type { OrderItem } from '../db/dexie';
import { VOICE_VOCABULARY, type VoiceRegion } from '../constants/voiceVocabulary';

// ─── Crystal-Clear Voice Selection (mirrors VoiceContext) ───────────────

const MALE_KEYWORDS = ['male', 'david', 'mark', 'ravi', 'hemant', 'heera', 'prabhat', 'guy', 'boy', 'man'];
const QUALITY_TAGS = ['online', 'neural', 'natural', 'enhanced', 'premium'];

const KNOWN_HINDI = [
  'microsoft swara online', 'microsoft swara',
  'google hindi', 'google हिन्दी',
  'lekha', 'hindi female',
];

const KNOWN_ENGLISH = [
  'microsoft neerja online', 'microsoft neerja',
  'jenny online', 'jenny', 'aria online', 'aria',
  'google us english', 'samantha', 'zira',
];

function getBestFemaleVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const isHindi = lang.startsWith('hi');
  const known = isHindi ? KNOWN_HINDI : KNOWN_ENGLISH;
  const langPrefix = lang.split('-')[0];

  const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
  const pool = langVoices.length > 0 ? langVoices : voices;
  const candidates = pool.filter(v => 
    !MALE_KEYWORDS.some(k => v.name.toLowerCase().includes(k))
  );

  // Named trusted voices first
  for (const name of known) {
    const match = candidates.find(v => v.name.toLowerCase().includes(name));
    if (match) return match;
  }

  // Neural/Online quality voices
  for (const tag of QUALITY_TAGS) {
    const match = candidates.find(v => v.name.toLowerCase().includes(tag));
    if (match) return match;
  }

  // Female keyword
  const female = candidates.find(v => 
    ['female', 'woman', 'girl'].some(k => v.name.toLowerCase().includes(k))
  );
  if (female) return female;

  // Brand voices
  const brand = candidates.find(v => 
    ['google', 'microsoft'].some(k => v.name.toLowerCase().includes(k))
  );
  if (brand) return brand;

  return candidates[0] || pool[0] || null;
}

// ─── Crystal-clear speak function ───────────────────────────────────────

function speakClear(text: string) {
  if (!('speechSynthesis' in window)) return;
  if (localStorage.getItem('voice_muted') === 'true') return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const isHindi = /[\u0900-\u097F]/.test(text);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
  
  // Read user's custom voice settings from localStorage
  const pitch = parseFloat(localStorage.getItem('voice_pitch') || '1.12');
  const rate = parseFloat(localStorage.getItem('voice_rate') || '0.93');
  const volume = parseFloat(localStorage.getItem('voice_volume') || '1.0');
  utterance.pitch = isNaN(pitch) ? 1.12 : pitch;
  utterance.rate = isNaN(rate) ? 0.93 : rate;
  utterance.volume = isNaN(volume) ? 1.0 : volume;

  // Use manually selected voice if set, otherwise auto-select
  const selectedName = localStorage.getItem('voice_selected_name') || '';
  if (selectedName) {
    const manual = synth.getVoices().find(v => v.name === selectedName);
    if (manual) utterance.voice = manual;
    else {
      const voice = getBestFemaleVoice(utterance.lang);
      if (voice) utterance.voice = voice;
    }
  } else {
    const voice = getBestFemaleVoice(utterance.lang);
    if (voice) utterance.voice = voice;
  }

  synth.speak(utterance);
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Announce an order with regional vocabulary
 */
export function announceOrder(
  customerName: string, 
  items: OrderItem[], 
  type?: 'counter' | 'table', 
  no?: string
) {
  if (!('speechSynthesis' in window)) return;

  const region = (localStorage.getItem('voice_region') as VoiceRegion) || 'awadhi';
  const vocab = VOICE_VOCABULARY[region];
  
  let phrase = '';
  const idValue = 'NEW'; // Stub for standalone script, should pass actual ID if available
  if (type === 'counter' && no) {
    phrase = vocab.ORDER_ALERT_SHOP(customerName, `Counter ${no}`, idValue);
  } else if (type === 'table' && no) {
    phrase = vocab.ORDER_ALERT_SHOP(customerName, `Table ${no}`, idValue);
  } else {
    phrase = vocab.ORDER_ALERT_SHOP(customerName, 'counter', idValue);
  }

  const itemStr = items.map((i) => `${i.quantity} ${i.name}`).join(', ');
  const fullText = `${phrase} Isme shamil hain: ${itemStr}.`;

  speakClear(fullText);
}

/**
 * Announce any text with crystal-clear Indian female voice
 */
export function announceText(text: string) {
  speakClear(text);
}
