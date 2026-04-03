import { Clock, User, PackageOpen, Volume2, Banknote, QrCode, CheckCircle2 } from 'lucide-react';
import type { PendingOrder } from '../../db/dexie';
import { announceOrder } from '../../utils/announce';
import { decrypt } from '../../utils/encryption';
import { useLanguage } from '../../context/LanguageContext';
import SecureCanvas from '../ui/SecureCanvas';

interface OrderCardProps {
  order: PendingOrder;
  onClick: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const { t } = useLanguage();
  const customerName = decrypt(order.customerName);
  const timeAgo = getTimeAgo(order.createdAt);

  const handleAnnounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    announceOrder(customerName, order.items, order.type, order.no);
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-kirana-green/30 transition-all cursor-pointer active:scale-[0.98] overflow-hidden ${
        order.status === 'ready' ? 'ring-2 ring-kirana-green/20' : ''
      }`}
    >
      <div className="flex gap-3 p-4">
        {/* Customer photo thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
          {order.photoDataUrl ? (
            <SecureCanvas 
              image={order.photoDataUrl} 
              width={100} 
              height={100} 
              className="w-full h-full border-none"
              tagline="Secure"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <User size={22} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <SecureCanvas content={customerName} width={200} height={24} fontSize={14} className="border-none bg-transparent" />
            {order.status === 'ready' ? (
              <span className="text-[10px] font-black uppercase text-white bg-kirana-green px-2 py-0.5 rounded-md shrink-0 animate-pulse ring-2 ring-kirana-green/30">
                READY
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase text-kirana-green bg-kirana-green/10 px-2 py-0.5 rounded-md shrink-0 border border-kirana-green/20">
                NEW
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <PackageOpen size={12} /> {order.items.length}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {timeAgo}
              </span>
            </div>

            {/* Payment Badge */}
            {order.paymentStatus && (
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                order.paymentReceived 
                  ? 'bg-kirana-green/10 text-kirana-green border border-kirana-green/20' 
                  : order.paymentStatus === 'upi' 
                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              }`}>
                {order.paymentReceived ? (
                  <>
                    <CheckCircle2 size={10} />
                    {t('customer.paymentReceived')}
                  </>
                ) : order.paymentStatus === 'upi' ? (
                  <>
                    <QrCode size={10} />
                    UPI
                  </>
                ) : (
                  <>
                    <Banknote size={10} />
                    COD
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick item preview */}
          <p className="text-xs text-slate-400 mt-1.5 truncate">
            {order.items.map((i) => `${i.quantity} ${i.name}`).join(', ')}
          </p>
        </div>

        {/* Announce button */}
        <button
          onClick={handleAnnounce}
          className="self-center p-2.5 rounded-xl bg-kirana-orange/10 text-kirana-orange hover:bg-kirana-orange hover:text-white transition-all shrink-0"
          title="Boli Sunao"
        >
          <Volume2 size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function getTimeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return 'Abhi';
  if (diff < 3600) return `${Math.floor(diff / 60)} min pehle`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ghante pehle`;
  return `${Math.floor(diff / 86400)} din pehle`;
}
