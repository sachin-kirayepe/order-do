import { useEffect, useState, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import db from '../../db/dexie';
import type { ShopProfile, PendingOrder, OrderHistory, OrderItem, MenuItem } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import {
  LogOut, QrCode, ListOrdered, History, Download, Copy, Printer,
  Bell, BellOff, PackageOpen, IndianRupee, HardDriveDownload, Upload,
  Sun, Moon, UtensilsCrossed, Plus, Trash2, Sparkles, Mic,
  TrendingUp, Lock, Shield
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '../../components/ui/Skeleton';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { decrypt } from '../../utils/encryption';
import OrderCard from '../../components/shopkeeper/OrderCard';
import OrderModal from '../../components/shopkeeper/OrderModal';
import MultiQRGenerator from '../../components/shopkeeper/MultiQRGenerator';
import { useAntiCapture } from '../../hooks/useAntiCapture';
import ProtectionOverlay from '../../components/ui/ProtectionOverlay';
import SecureCanvas from '../../components/ui/SecureCanvas';
import haptics from '../../utils/haptics';
import useSound from '../../hooks/useSound';
import PullToRefresh from '../../components/ui/PullToRefresh';
import { announceText } from '../../utils/announce';
import { exportBackup, downloadJSON, importBackup } from '../../utils/backup';
import DailySalesReport from '../../components/shopkeeper/DailySalesReport';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import { useTalkingCharacter } from '../../context/TalkingCharacterContext';

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

type Tab = 'orders' | 'history' | 'qr' | 'report' | 'menu';

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const { subscription, hasFeature, loading: subLoading } = useSubscription();
  const { theme, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const { playNotification } = useSound();
  const { speak, setIsVisible } = useTalkingCharacter();
  const navigate = useNavigate();

  // Profile
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Assistant
  const [isAssistantListening, setIsAssistantListening] = useState(false);

  const handleAssistantVoice = () => {
    if (!SpeechRecognition) {
      toast.error(t('customer.voiceNotSupported'));
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'hi-IN';
    rec.onstart = () => {
      setIsAssistantListening(true);
      haptics.light();
    };
    rec.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = await db.orderHistory.where('completedAt').above(today.getTime()).toArray();
      
      const totalSale = todayOrders.reduce((sum, o) => sum + o.total, 0);
      const orderCount = todayOrders.length;
      
      if (transcript.includes('sale') || transcript.includes('kamai') || transcript.includes('बिक्री') || transcript.includes('कमाई')) {
        const text = language === 'hi' 
          ? `Aaj ki kul bikri ${totalSale} rupaye hai aur aapne ${orderCount} order poore kiye hain.` 
          : `Today's total sale is ${totalSale} rupees from ${orderCount} orders.`;
        speak(text);
        toast(text, { icon: <TrendingUp className="text-kirana-green" /> });
        setTab('report');
      } else if (transcript.includes('order') || transcript.includes('ऑर्डर')) {
        const text = language === 'hi' 
          ? `अभी आपके पास ${pending.length} पेंडिंग ऑर्डर हैं।` 
          : `You have ${pending.length} pending orders right now.`;
        announceText(text);
        setTab('orders');
      } else {
        speak(language === 'hi' ? 'Kshama karein, mujhe samajh nahi aaya.' : "Sorry, I didn't get that.");
      }
    };
    rec.onerror = () => setIsAssistantListening(false);
    rec.onend = () => setIsAssistantListening(false);
    rec.start();
  };

  // Orders
  const [pending, setPending] = useState<PendingOrder[]>([]);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);

  // UI
  const [tab, setTab] = useState<Tab>('orders');
  const [autoAnnounce, setAutoAnnounce] = useState(true);
  const [isGeneratingMultiQR, setIsGeneratingMultiQR] = useState(false);
  const { isBlocked } = useAntiCapture(tab === 'orders' || tab === 'history');

  // Menu Management
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', category: '', description: '' });
  const [isAddingMenu, setIsAddingMenu] = useState(false);

  // QR
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPendingCountRef = useRef(0);

  // Load profile
  useEffect(() => {
    const load = async () => {
      const profiles = await db.shopProfile.toArray();
      const p = profiles.find((x) => x.id === user?.id) || profiles[profiles.length - 1];
      if (!p) {
        navigate('/shop/setup');
      } else {
        setProfile(p);
        const items = await db.menuItems.where('shopId').equals(p.shopId).toArray();
        setMenuItems(items);
        setIsVisible(true);
        
        // Initial Dashboard Status Report by Dhara
        const pendingCount = await db.pendingOrders.where('shopId').equals(p.shopId).count();
        const welcomeText = language === 'hi' 
          ? `नमस्ते! ${p.shopName} में आपका स्वागत है। अभी आपके पास ${pendingCount} पेंडिंग ऑर्डर हैं।` 
          : `Namaste! Welcome to ${p.shopName}. You have ${pendingCount} pending orders right now.`;
        
        speak(welcomeText, pendingCount > 0 ? 'pointing' : 'success');
      }
      setLoading(false);
    };
    load();
  }, [user, navigate, speak, setIsVisible, language]);

  // Refresh
  const refreshOrders = useCallback(async () => {
    if (!profile) return;
    const p = await db.pendingOrders
      .where('shopId')
      .equals(profile.shopId)
      .reverse()
      .sortBy('createdAt');
    
    if (autoAnnounce && p.length > lastPendingCountRef.current && lastPendingCountRef.current > 0) {
      const newest = p[0];
      if (newest) {
        playNotification();
        haptics.warning();
        const customerName = decrypt(newest.customerName);
        const orderAlertText = language === 'hi' 
          ? `नया ऑर्डर आया है! ${customerName} ने ऑर्डर किया है।` 
          : `New order arrived from ${customerName}!`;
        speak(orderAlertText, 'pointing');
      }
    }
    lastPendingCountRef.current = p.length;
    setPending(p);

    const h = await db.orderHistory
      .where('shopId')
      .equals(profile.shopId)
      .reverse()
      .sortBy('completedAt');
    setHistory(h);
  }, [profile, autoAnnounce, playNotification, t]);

  useEffect(() => {
    if (!profile) return;
    refreshOrders();
    const interval = setInterval(refreshOrders, 3000);
    return () => clearInterval(interval);
  }, [profile, refreshOrders]);

  // Menu actions
  const handleAddMenuItem = async () => {
    if (!profile || !newMenuItem.name || !newMenuItem.price) return;
    try {
      const item = {
        shopId: profile.shopId,
        name: newMenuItem.name,
        price: parseFloat(newMenuItem.price),
        description: newMenuItem.description || undefined,
        available: true
      };
      const id = await db.menuItems.add(item);
      setMenuItems([...menuItems, { ...item, id: id as number }]);
      setNewMenuItem({ name: '', price: '', category: '', description: '' });
      setIsAddingMenu(false);
      toast.success(t('setup.menu.saveMenu') || 'Item added');
      haptics.success();
    } catch (err) {
      toast.error('Error adding item');
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    await db.menuItems.delete(id);
    setMenuItems(menuItems.filter(m => m.id !== id));
    toast.success('Item removed');
    haptics.warning();
  };

  // QR actions
  const handleGenerateExtraQRs = async (items: { type: 'counter' | 'table'; no: string; code: string }[]) => {
    if (!profile) return;
    const updatedExtras = [...(profile.extraQRs || []), ...items];
    const uniqueExtras = Array.from(new Set(updatedExtras.map(ex => `${ex.type}-${ex.no}`)))
      .map(key => {
        const entry = updatedExtras.find(ex => `${ex.type}-${ex.no}` === key)!;
        return { type: entry.type, no: entry.no, code: entry.code };
      });

    await db.shopProfile.update(profile.id, { extraQRs: uniqueExtras });
    const historyEntries = items.map(it => ({
      code: it.code,
      shopId: profile.shopId,
      type: it.type,
      no: it.no,
      createdAt: Date.now()
    }));
    await db.qrHistory.bulkAdd(historyEntries);
    setProfile({ ...profile, extraQRs: uniqueExtras });
    toast.success(t('dashboard.generateAll'));
    haptics.success();
  };

  const handleDeleteExtraQR = async (type: string, no: string) => {
    if (!profile || !profile.extraQRs) return;
    const filtered = profile.extraQRs.filter(ex => !(ex.type === type && ex.no === no));
    await db.shopProfile.update(profile.id, { extraQRs: filtered });
    setProfile({ ...profile, extraQRs: filtered });
    haptics.warning();
  };

  useEffect(() => {
    if (profile && canvasRef.current && tab === 'qr') {
      const codeParam = profile.masterQrCode ? `&code=${profile.masterQrCode}` : '';
      const url = `${window.location.origin}/order?shop=${profile.shopId}${codeParam}`;
      QRCode.toCanvas(canvasRef.current, url, {
        width: 250,
        margin: 2,
        color: { dark: '#15803d', light: '#ffffff' },
      });
    }
  }, [profile, tab]);

  // Order actions
  const handleDone = async (order: PendingOrder, pricedItems: OrderItem[], total: number, paymentReceived: boolean) => {
    const customerName = decrypt(order.customerName);
    await db.orderHistory.put({
      id: order.id,
      shopId: order.shopId,
      customerName: order.customerName,
      customerAddress: order.customerAddress,
      photoDataUrl: order.photoDataUrl,
      items: pricedItems,
      total,
      status: 'completed',
      createdAt: order.createdAt,
      completedAt: Date.now(),
      paymentStatus: order.paymentStatus,
      paymentReceived: paymentReceived,
      type: order.type,
      no: order.no,
    });
    await db.pendingOrders.delete(order.id);
    setSelectedOrder(null);
    toast.success(t('dashboard.orderComplete').replace('[name]', customerName).replace('[total]', total.toString()));
    haptics.success();
    await refreshOrders();
  };

  const handleReject = async (order: PendingOrder) => {
    const customerName = decrypt(order.customerName);
    if (!confirm(t('dashboard.rejectConfirm').replace('[name]', customerName))) return;
    await db.orderHistory.put({
      id: order.id,
      shopId: order.shopId,
      customerName: order.customerName,
      customerAddress: order.customerAddress,
      photoDataUrl: order.photoDataUrl,
      items: order.items,
      total: 0,
      status: 'rejected',
      createdAt: order.createdAt,
      completedAt: Date.now(),
    });
    await db.pendingOrders.delete(order.id);
    setSelectedOrder(null);
    toast.error(t('customer.failure') || 'Order reject kiya gaya');
    haptics.warning();
    await refreshOrders();
  };

  // QR helpers
  const handleDownloadQR = () => {
    if (!canvasRef.current || !profile) return;
    const link = document.createElement('a');
    link.download = `QR-${profile.shopId}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    haptics.light();
  };

  const handleCopyLink = () => {
    if (!profile) return;
    const codeParam = profile.masterQrCode ? `&code=${profile.masterQrCode}` : '';
    navigator.clipboard.writeText(`${window.location.origin}/order?shop=${profile.shopId}${codeParam}`);
    toast.success(t('dashboard.linkCopied'));
    haptics.light();
  };

  const handlePrintQR = () => {
    if (!canvasRef.current || !profile) return;
    const dataUrl = canvasRef.current.toDataURL();
    const w = window.open('', '', 'width=600,height=600');
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><title>QR - ${profile.shopName}</title>
      <style>body{text-align:center;padding:50px;font-family:sans-serif}.qr-card{border:2px solid #f1f5f9;border-radius:20px;padding:20px;display:inline-block;margin:10px}</style>
      </head>
      <body>
        <div class="qr-card">
          <h1>${profile.shopName}</h1>
          <img src="${dataUrl}" style="width:300px">
          <h2>${t('dashboard.scanToOrder')}</h2>
          <p style="color:#64748b">${profile.shopId}</p>
        </div>
      </body></html>`);
      w.document.close();
      w.focus();
      haptics.light();
      setTimeout(() => {
        w.print();
        w.close();
      }, 500);
    }
  };

  const handlePrintAllQRs = async () => {
    if (!profile) return;
    const w = window.open('', '', 'width=800,height=800');
    if (!w) return;

    let html = `<!DOCTYPE html><html><head><title>All QRs - ${profile.shopName}</title>
    <style>
      body { font-family: sans-serif; display: flex; flex-wrap: wrap; justify-content: center; padding: 20px; background: #f8fafc; }
      .qr-card { border: 2px solid #e2e8f0; border-radius: 24px; padding: 30px; margin: 15px; background: white; text-align: center; width: 300px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      h1 { margin: 0 0 5px 0; font-size: 20px; color: #1e293b; }
      h2 { margin: 5px 0 15px 0; font-size: 16px; color: #15803d; }
      .qr-img { width: 220px; height: 220px; }
      .footer { margin-top: 15px; font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; }
    </style></head><body>`;

    const mCode = profile.masterQrCode ? `&code=${profile.masterQrCode}` : '';
    const masterUrl = `${window.location.origin}/order?shop=${profile.shopId}${mCode}`;
    const masterCanvas = document.createElement('canvas');
    await QRCode.toCanvas(masterCanvas, masterUrl, { width: 400, margin: 1 });
    
    html += `
      <div class="qr-card">
        <h1>${profile.shopName}</h1>
        <h2>Master QR</h2>
        <img src="${masterCanvas.toDataURL()}" class="qr-img">
        <div class="footer">Order-Do // Scan to Order</div>
      </div>
    `;

    for (const ex of (profile.extraQRs || [])) {
      const url = `${window.location.origin}/order?shop=${profile.shopId}&type=${ex.type}&no=${ex.no}&code=${ex.code}`;
      const tempCanvas = document.createElement('canvas');
      await QRCode.toCanvas(tempCanvas, url, { width: 400, margin: 1 });
      html += `
        <div class="qr-card">
          <h1>${profile.shopName}</h1>
          <h2>${ex.type === 'table' ? t('kds.table') : t('kds.counter')} ${ex.no}</h2>
          <img src="${tempCanvas.toDataURL()}" class="qr-img">
          <div class="footer">Order-Do // Scan to Order</div>
        </div>
      `;
    }

    html += `</body></html>`;
    w.document.write(html);
    w.document.close();
    w.focus();
    haptics.light();
    setTimeout(() => {
      w.print();
      w.close();
    }, 500);
  };

  const handleExportBackup = async () => {
    try {
      const json = await exportBackup();
      downloadJSON(json, `OrderDo-Backup-${new Date().toISOString().slice(0,10)}.json`);
      toast.success(t('dashboard.backupSuccess'));
      haptics.success();
    } catch {
      toast.error(t('dashboard.backupError'));
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await importBackup(file);
      toast.success(t('dashboard.importSuccess').replace('[count]', count.toString()));
      haptics.success();
      await refreshOrders();
    } catch {
      toast.error(t('dashboard.importError'));
    }
  };

  // Guard
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 relative">
        <ProtectionOverlay isVisible={isBlocked} />
        <div className="h-[60px] bg-white dark:bg-slate-800 border-b border-slate-100 px-4 flex items-center justify-between">
           <Skeleton className="w-32 h-6" />
           <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <div className="p-4 space-y-4 max-w-xl mx-auto">
          <Skeleton className="w-full h-10 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="w-full h-32 rounded-2xl" />
            <Skeleton className="w-full h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <PullToRefresh onRefresh={refreshOrders}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 relative overflow-hidden text-slate-900 dark:text-slate-100">
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 p-1.5 border border-slate-100 dark:border-slate-600 shadow-inner shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-800 dark:text-white truncate">{profile.shopName}</h1>
              <p className="text-xs text-kirana-green font-mono font-medium">{profile.shopId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile.shopType === 'Restaurant' && (
              <button 
                onClick={() => navigate('/shop/kds')}
                className="px-3 py-2 bg-slate-800 text-white rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg"
              >
                <UtensilsCrossed size={16} />
                <span className="hidden sm:inline">{t('dashboard.kdsBtn')}</span>
              </button>
            )}
            {isAdmin && (
               <button 
                onClick={() => navigate('/admin')}
                className="px-3 py-2 bg-gradient-to-r from-kirana-orange to-amber-600 text-white rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-kirana-orange/20"
              >
                <Shield size={16} />
                <span className="hidden sm:inline">{t('dashboard.adminPanel')}</span>
              </button>
            )}
            <button 
              onClick={() => { setAutoAnnounce(!autoAnnounce); haptics.light(); }}
              className={`p-2 rounded-xl ${autoAnnounce ? 'text-kirana-orange' : 'text-slate-400'}`}
            >
              {autoAnnounce ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
            <LanguageSwitcher />
            <button onClick={() => { toggleTheme(); haptics.light(); }} className="p-2">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button onClick={() => { logout(); navigate('/'); haptics.warning(); }} className="p-2 text-red-500">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <nav className="bg-white dark:bg-slate-800 border-b px-2 flex gap-1 sticky top-[57px] z-20 overflow-x-auto no-scrollbar">
          {(['orders', 'history', 'menu', 'qr', 'report'] as Tab[]).map((k) => (
            <button
              key={k}
              onClick={() => { setTab(k); haptics.light(); }}
              className={`flex-1 min-w-[70px] py-3 text-xs font-bold border-b-2 transition-all ${tab === k ? 'border-kirana-green text-kirana-green' : 'border-transparent text-slate-400'}`}
            >
              {t(`dashboard.${k}` as any) || k.toUpperCase()}
              {k === 'orders' && pending.length > 0 && (
                <span className="ml-1 bg-kirana-green text-white px-1.5 rounded-full">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto px-4 pb-24 relative z-10">
          <div className="max-w-xl mx-auto py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === 'orders' && (
                    <div className="space-y-3">
                      {pending.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center text-slate-400">
                          <PackageOpen size={48} className="mb-4 opacity-20" />
                          <p>{t('dashboard.noOrders')}</p>
                        </div>
                      ) : (
                        pending.map((o) => <OrderCard key={o.id} order={o} onClick={() => { setSelectedOrder(o); haptics.light(); }} />)
                      )}
                    </div>
                  )}

                  {tab === 'history' && (
                    <div className="space-y-3">
                      {history.length === 0 ? (
                        <p className="text-center py-16 text-slate-400">{t('dashboard.noHistory')}</p>
                      ) : (
                        history.map((h) => (
                          <div key={h.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                {h.photoDataUrl && <SecureCanvas image={h.photoDataUrl} width={100} height={100} className="w-full h-full border-none" tagline="S" />}
                              </div>
                              <div>
                                <SecureCanvas content={decrypt(h.customerName)} width={120} height={20} fontSize={14} className="border-none bg-transparent" />
                                <p className="text-[10px] text-slate-400">{new Date(h.completedAt).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-kirana-green">
                              <IndianRupee size={12} /> {h.total}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {tab === 'qr' && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-lg border text-center flex flex-col items-center">
                        <canvas ref={canvasRef} className="rounded-lg shadow-sm mb-6" />
                        <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-6">
                          <button onClick={handleDownloadQR} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl flex flex-col items-center gap-1">
                            <Download size={20} className="text-kirana-green" />
                            <span className="text-[10px] font-bold">Save</span>
                          </button>
                          <button onClick={handleCopyLink} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl flex flex-col items-center gap-1">
                            <Copy size={20} className="text-kirana-orange" />
                            <span className="text-[10px] font-bold">Copy</span>
                          </button>
                          <button onClick={handlePrintQR} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl flex flex-col items-center gap-1">
                            <Printer size={20} className="text-slate-500" />
                            <span className="text-[10px] font-bold">Print</span>
                          </button>
                        </div>
                        <button onClick={() => setIsGeneratingMultiQR(true)} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                           <Plus size={18} /> {t('dashboard.multiQRBtn')}
                        </button>
                        
                        {profile.extraQRs && profile.extraQRs.length > 0 && (
                          <div className="mt-8 w-full border-t pt-8 space-y-4">
                            <div className="flex justify-between items-center px-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase">Extra QRs</span>
                              <button onClick={handlePrintAllQRs} className="text-[10px] font-bold text-kirana-green uppercase">Print All</button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              {profile.extraQRs.map((ex, i) => (
                                <div key={i} className="group relative p-3 bg-white dark:bg-slate-900 border rounded-2xl flex flex-col items-center">
                                  <QRItem shopId={profile.shopId} type={ex.type} no={ex.no} code={ex.code} />
                                  <p className="mt-2 text-[10px] font-bold uppercase">{ex.type} {ex.no}</p>
                                  <button onClick={() => handleDeleteExtraQR(ex.type, ex.no)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-8 w-full border-t pt-8">
                          <button onClick={handleExportBackup} className="py-3 bg-kirana-green/10 text-kirana-green rounded-xl font-bold text-[10px] uppercase">Backup</button>
                          <label className="py-3 bg-kirana-orange/10 text-kirana-orange rounded-xl font-bold text-[10px] uppercase cursor-pointer">
                            Import
                            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === 'menu' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold">{t('setup.menu.title')}</h2>
                        <button onClick={() => setIsAddingMenu(!isAddingMenu)} className="p-2 bg-kirana-green text-white rounded-xl shadow-lg">
                          <Plus size={20} />
                        </button>
                      </div>
                      {isAddingMenu && (
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-kirana-green/30 space-y-3 shadow-md">
                          <Input placeholder="Item Name" value={newMenuItem.name} onChange={(e: any) => setNewMenuItem({...newMenuItem, name: e.target.value})} />
                          <Input placeholder="Description (Optional)" value={newMenuItem.description} onChange={(e: any) => setNewMenuItem({...newMenuItem, description: e.target.value})} />
                          <div className="flex gap-2">
                             <Input placeholder="Price" value={newMenuItem.price} onChange={(e: any) => setNewMenuItem({...newMenuItem, price: e.target.value})} />
                             <Input placeholder="Category (e.g. Snacks)" value={newMenuItem.category} onChange={(e: any) => setNewMenuItem({...newMenuItem, category: e.target.value})} />
                             <Button onClick={handleAddMenuItem}>Add</Button>
                          </div>
                        </div>
                      )}
                      <div className="space-y-3">
                        {menuItems.map(m => (
                          <div key={m.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border flex items-center justify-between group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold truncate">{m.name}</p>
                                {m.category && (
                                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500 uppercase tracking-tighter">
                                    {m.category}
                                  </span>
                                )}
                              </div>
                              {m.description && (
                                <p className="text-xs text-slate-400 line-clamp-1 mb-1">{m.description}</p>
                              )}
                              <p className="text-sm font-bold text-kirana-green">₹{m.price}</p>
                            </div>
                            <button onClick={() => m.id && handleDeleteMenuItem(m.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab === 'report' && (
                    <div>
                      {!hasFeature('reports') ? (
                         <div className="bg-white dark:bg-slate-800 p-12 rounded-[3rem] text-center shadow-xl">
                            <Lock size={48} className="mx-auto text-kirana-orange mb-4" />
                            <p className="text-sm font-bold text-slate-400">Upgrade to Pro to unlock reports</p>
                         </div>
                      ) : (
                        <DailySalesReport shopId={profile.shopId} />
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
          </div>
        </main>

        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onDone={handleDone}
            onReject={handleReject}
          />
        )}
        
        <AnimatePresence>
          {isGeneratingMultiQR && (
            <MultiQRGenerator 
              shopId={profile.shopId}
              onClose={() => setIsGeneratingMultiQR(false)} 
              onGenerate={handleGenerateExtraQRs}
            />
          )}
        </AnimatePresence>

        <div className="fixed bottom-24 right-6 z-50">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAssistantVoice}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all ${isAssistantListening ? 'bg-red-500 animate-pulse' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border'}`}
          >
            {isAssistantListening ? <Mic size={24} /> : <Sparkles size={24} className="text-kirana-orange" />}
            <span className="font-bold text-sm tracking-tight">{isAssistantListening ? '...' : 'Assistant'}</span>
          </motion.button>
        </div>
      </div>
    </PullToRefresh>
  );
}

function QRItem({ shopId, type, no, code }: { shopId: string; type: string; no: string; code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      const url = `${window.location.origin}/order?shop=${shopId}&type=${type}&no=${no}&code=${code}`;
      QRCode.toCanvas(canvasRef.current, url, { width: 140, margin: 1 });
    }
  }, [shopId, type, no, code]);
  return (
    <div onClick={() => {
      if (!canvasRef.current) return;
      const link = document.createElement('a');
      link.download = `QR-${type}-${no}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
      haptics.light();
    }} className="cursor-pointer active:scale-95 transition-transform">
      <canvas ref={canvasRef} className="rounded-lg shadow-sm w-full" />
    </div>
  );
}
