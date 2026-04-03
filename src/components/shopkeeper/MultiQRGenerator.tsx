import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, QrCode, UtensilsCrossed, Monitor } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { toast } from 'sonner';

import { generateUniqueQrCode } from '../../utils/qrUniqueness';

interface MultiQRGeneratorProps {
  shopId: string;
  onClose: () => void;
  onGenerate: (items: { type: 'counter' | 'table'; no: string; code: string }[]) => void;
}

export default function MultiQRGenerator({ shopId, onClose, onGenerate }: MultiQRGeneratorProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<'counter' | 'table'>('table');
  const [numbers, setNumbers] = useState<string[]>([]);
  const [currentNo, setCurrentNo] = useState('');

  const handleAdd = () => {
    if (!currentNo.trim()) return;
    if (numbers.includes(currentNo.trim())) {
      toast.error(t('common.error') || 'Already added');
      return;
    }
    setNumbers([...numbers, currentNo.trim()]);
    setCurrentNo('');
  };

  const handleRemove = (no: string) => {
    setNumbers(numbers.filter(n => n !== no));
  };

  const handleGenerate = () => {
    if (numbers.length === 0) {
      toast.error(t('customer.itemsRequired') || 'Add at least one');
      return;
    }
    const items = numbers.map(no => ({ 
      type, 
      no, 
      code: generateUniqueQrCode(shopId) 
    }));
    onGenerate(items);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <QrCode className="text-kirana-green" />
              {t('dashboard.multiQRModalTitle')}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Mode Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                {t('setup.multiQR.typeLabel')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setType('table')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-semibold ${
                    type === 'table' 
                      ? 'border-kirana-green bg-kirana-green/5 text-kirana-green shadow-sm' 
                      : 'border-slate-100 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  <UtensilsCrossed size={18} />
                  {t('dashboard.tableMode')}
                </button>
                <button
                  onClick={() => setType('counter')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-semibold ${
                    type === 'counter' 
                      ? 'border-kirana-green bg-kirana-green/5 text-kirana-green shadow-sm' 
                      : 'border-slate-100 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  <Monitor size={18} />
                  {t('dashboard.counterMode')}
                </button>
              </div>
            </div>

            {/* Input Section */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label={t('dashboard.addNumber')}
                  placeholder="e.g. 1, 2, A1..."
                  value={currentNo}
                  onChange={(e: any) => setCurrentNo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <button
                onClick={handleAdd}
                className="p-3 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-colors mb-0.5"
              >
                <Plus size={24} />
              </button>
            </div>

            {/* List Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-4 min-h-[120px] max-h-[240px] overflow-y-auto border border-slate-100 dark:border-slate-700 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {numbers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8 italic opacity-60">
                    {t('dashboard.noExtraQRs')}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {numbers.map((no) => (
                      <motion.div
                        key={no}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="group relative flex items-center justify-center py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 shadow-sm"
                      >
                        <span className="truncate">{no}</span>
                        <button
                          onClick={() => handleRemove(no)}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X size={10} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="secondary" onClick={() => setNumbers([])} className="flex-1">
              {t('dashboard.clearAll')}
            </Button>
            <Button onClick={handleGenerate} className="flex-[2] bg-kirana-green hover:bg-kirana-green/90 border-none shadow-lg shadow-kirana-green/20">
              {t('dashboard.generateAll')}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
