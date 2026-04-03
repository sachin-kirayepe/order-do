import { useState, useRef } from 'react';
import { Mic, MicOff, Plus, Trash2, PackageOpen } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { OrderItem } from '../../db/dexie';

interface VoiceItemListProps {
  items: OrderItem[];
  onItemsChange: (items: OrderItem[]) => void;
}

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// Parse voice transcript into typed items
// e.g., "2 kilo atta, 1 packet namak, aadha litre tel" 
function parseVoiceItems(transcript: string): OrderItem[] {
  const parts = transcript.split(/,|aur|और/i).map((s) => s.trim()).filter(Boolean);
  return parts.map((part) => {
    // Try to extract leading quantity token
    const match = part.match(/^(\d+(?:\.\d+)?\s*(?:kilo|kg|gram|gm|litre|liter|ml|packet|pack|dozen|pcs|piece|aadha|ek|do|teen|chaar|paanch)?)\s+(.+)/i);
    if (match) {
      return { quantity: match[1].trim(), name: match[2].trim() };
    }
    return { quantity: '1', name: part };
  });
}

export default function VoiceItemList({ items, onItemsChange }: VoiceItemListProps) {
  const { t } = useLanguage();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState('1');
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (!SpeechRecognition) {
      setError(t('customer.voiceNotSupported'));
      return;
    }
    setError('');
    setTranscript('');
    const rec = new SpeechRecognition();
    rec.lang = 'hi-IN';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = () => {
      setError(t('customer.voiceTryAgain'));
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      // Use the final transcript from onresult
      const finalTranscript = recognitionRef.current?._lastTranscript || transcript;
      if (finalTranscript) {
        const parsed = parseVoiceItems(finalTranscript);
        onItemsChange([...items, ...parsed]);
      }
    };
    recognitionRef.current = rec;
    recognitionRef.current._lastTranscript = '';
    // Capture final on result
    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        interim += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          recognitionRef.current._lastTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(interim);
    };
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const removeItem = (idx: number) => {
    onItemsChange(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof OrderItem, value: string) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    onItemsChange(updated);
  };

  const addManualItem = () => {
    if (!newItem.trim()) return;
    onItemsChange([...items, { name: newItem.trim(), quantity: newQty || '1' }]);
    setNewItem('');
    setNewQty('1');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Big Mic button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={listening ? stopListening : startListening}
          className={`w-28 h-28 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${
            listening ? 'bg-red-500 animate-pulse scale-110' : 'bg-kirana-green hover:bg-kirana-dark'
          }`}
        >
          {listening ? <MicOff size={44} /> : <Mic size={44} />}
        </button>
        <p className="text-sm text-slate-500 text-center">
          {listening
            ? `${t('customer.listening')} "${transcript}"`
            : t('customer.itemsPlaceholder')}
        </p>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Item table */}
      {items.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-[1fr_90px_40px] text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2">
            <span>{t('orders.items')}</span>
            <span>{t('orders.quantity')}</span>
            <span />
          </div>
          {items.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_90px_40px] items-center px-3 py-2 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <input
                value={item.name}
                onChange={(e) => updateItem(idx, 'name', e.target.value)}
                className="text-sm text-slate-800 dark:text-white bg-transparent focus:outline-none border-b border-transparent focus:border-kirana-green w-full"
              />
              <input
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                className="text-sm text-slate-600 dark:text-slate-300 bg-transparent focus:outline-none border-b border-transparent focus:border-kirana-green w-full"
              />
              <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition-colors flex justify-center">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
          <PackageOpen size={36} />
          <p className="text-sm text-center">{t('customer.noItems')}</p>
        </div>
      )}

      {/* Manual add row */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">{t('orders.items')}</label>
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addManualItem()}
            placeholder="e.g. Atta"
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm dark:bg-slate-900 dark:text-white focus:border-kirana-green focus:outline-none"
          />
        </div>
        <div className="w-20">
          <label className="text-xs text-slate-500 mb-1 block">{t('orders.quantity')}</label>
          <input
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            placeholder="1 kg"
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm dark:bg-slate-900 dark:text-white focus:border-kirana-green focus:outline-none"
          />
        </div>
        <button
          onClick={addManualItem}
          className="flex items-center justify-center w-10 h-10 mb-0.5 bg-kirana-green text-white rounded-xl hover:bg-kirana-dark active:scale-90 transition-all shadow-sm"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
