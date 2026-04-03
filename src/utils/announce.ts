import type { OrderItem } from '../db/dexie';

/**
 * Announce a new order using Web SpeechSynthesis API.
 * Requirements:
 * - Counter: "Counter number 9 se order aaya hai"
 * - Table: "Table number 7 se order aaya hai"
 * - Master QR: "Rahul bhai, aapki samaan ki list aa gayi hai"
 */
export function announceOrder(
  customerName: string, 
  items: OrderItem[], 
  type?: 'counter' | 'table', 
  no?: string
) {
  if (!('speechSynthesis' in window)) {
    console.warn('[announce] SpeechSynthesis not supported');
    return;
  }

  const lang = localStorage.getItem('order-do-lang') || 'hi';
  
  // 1. Build the intro greeting/phrase
  let phrase = '';
  if (type === 'counter' && no) {
    phrase = lang === 'hi' 
      ? `काउन्टर नंबर ${no} से ऑर्डर आया है। ` 
      : `New order from counter number ${no}. `;
  } else if (type === 'table' && no) {
    phrase = lang === 'hi' 
      ? `टेबल नंबर ${no} से ऑर्डर आया है। ` 
      : `New order from table number ${no}. `;
  } else {
    // Default / Master QR
    phrase = lang === 'hi'
      ? `${customerName} भाई, आपकी सामान की लिस्ट आ गई है। `
      : `${customerName}, your item list has arrived. `;
  }

  // 2. Build the item list summary
  const itemStr = items
    .map((i) => `${i.quantity} ${i.name}`)
    .join(', ');

  const itemsIntro = lang === 'hi' ? 'इसमें शामिल हैं: ' : 'It includes: ';
  const fullText = `${phrase}${itemsIntro}${itemStr}।`;

  const utterance = new SpeechSynthesisUtterance(fullText);
  utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  utterance.rate = 1;
  utterance.pitch = 1;

  // Try to find a high-quality Hindi voice
  const voices = speechSynthesis.getVoices();
  const hindiVoice = voices.find(
    (v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
  );
  if (hindiVoice) utterance.voice = hindiVoice;

  speechSynthesis.cancel(); // stop any previous speech
  speechSynthesis.speak(utterance);
}

/**
 * Announce a simple text string in specified language.
 */
export function announceText(text: string) {
  if (!('speechSynthesis' in window)) return;
  const lang = localStorage.getItem('order-do-lang') || 'hi';
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  utterance.rate = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}
