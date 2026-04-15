import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useLanguage } from '../../context/LanguageContext';

interface UPIQRCodeProps {
  upiId: string;
  shopName: string;
  amount: number;
}

export default function UPIQRCode({ upiId, shopName, amount }: UPIQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (canvasRef.current && upiId) {
      // Standard UPI Payment URI: upi://pay?pa=<address>&pn=<name>&am=<amount>&cu=INR
      const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${amount}&cu=INR`;
      
      QRCode.toCanvas(canvasRef.current, upiUri, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1e293b', // slate-800
          light: '#ffffff',
        },
      }, (error) => {
        if (error) console.error('Error generating UPI QR:', error);
      });
    }
  }, [upiId, shopName, amount]);

  if (!upiId) return null;

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-kirana-green/20 shadow-sm transition-all hover:shadow-md">
      <div className="bg-white p-2 rounded-2xl shadow-inner border border-slate-100">
        <canvas ref={canvasRef} className="rounded-xl" />
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          {t('customer.payUPI')}
        </p>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('customer.scanToPay').replace('[shopName]', shopName).replace('[amount]', amount.toString())}
        </p>
        <p className="text-[10px] text-slate-400 mt-2 font-mono break-all px-4">
          UPI ID: {upiId}
        </p>
      </div>
    </div>
  );
}
