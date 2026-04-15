import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  createProofAndDeletePersonalData, 
  performPrivacyAudit, 
  purgeStalePendingOrders, 
  cleanupOldOrders,
  archiveAndCleanupCloudOrders
} from '../../utils/privacyProof';
import OrderModal from '../../components/shopkeeper/OrderModal';
import ProofModal from '../../components/shopkeeper/ProofModal';
import MultiQRGenerator from '../../components/shopkeeper/MultiQRGenerator';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import db from '../../db/dexie';
import type { ShopProfile, PendingOrder, OrderHistory, OrderItem, MenuItem } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import {
  LogOut, QrCode, ListOrdered, History, Download, Copy, Printer,
  Bell, BellOff, PackageOpen, IndianRupee,
  Sun, Moon, UtensilsCrossed, Plus, Trash2, Sparkles,
  TrendingUp, Lock, Shield, ShieldCheck, Settings, ShieldAlert,
  Megaphone
} from 'lucide-react';
import { isExpired, isExpiringSoon, getFormattedRemainingTime } from '../../utils/dateUtils';
import VoiceSettings from '../../components/shopkeeper/VoiceSettings';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '../../components/ui/Skeleton';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { decrypt } from '../../utils/encryption';
import OrderCard from '../../components/shopkeeper/OrderCard';
import GlassCard from '../../components/ui/GlassCard';
import { useAntiCapture } from '../../hooks/useAntiCapture';
import ProtectionOverlay from '../../components/ui/ProtectionOverlay';
import SecureCanvas from '../../components/ui/SecureCanvas';
import haptics from '../../utils/haptics';
import useSound from '../../hooks/useSound';
import PullToRefresh from '../../components/ui/PullToRefresh';
import { useVoice } from '../../context/VoiceContext';
import { exportBackup, downloadJSON, importBackup } from '../../utils/backup';
import DailySalesReport from '../../components/shopkeeper/DailySalesReport';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import AdBanner from '../../components/ui/AdBanner';
import SessionManager from '../../components/settings/SessionManager';
import ShopTutorial from '../../components/shopkeeper/ShopTutorial';
import { HelpCircle } from 'lucide-react';

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

type Tab = 'orders' | 'history' | 'qr' | 'report' | 'menu' | 'settings';

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const { subscription, hasFeature, loading: subLoading } = useSubscription();
  const { theme, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const { playNotification } = useSound();
  const { speak, announceOrder } = useVoice();
  const navigate = useNavigate();

  // Profile
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Assistant
  const [isAssistantListening, setIsAssistantListening] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

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
        toast(text, { icon: <TrendingUp className="text-kirana-green" /> });
        setTab('report');
      } else if (transcript.includes('order') || transcript.includes('ऑर्डर')) {
        const text = language === 'hi' 
          ? `अभी आपके पास ${pending.length} पेंडिंग ऑर्डर हैं।` 
          : `You have ${pending.length} pending orders right now.`;
        speak(text);
        setTab('orders');
      } else {
        toast.error(language === 'hi' ? 'Kshama karein, mujhe samajh nahi aaya.' : "Sorry, I didn't get that.");
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
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<OrderHistory | null>(null);

  // UI
  const [tab, setTab] = useState<Tab>('orders');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'rejected'>('all');
  const [autoAnnounce, setAutoAnnounce] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isGeneratingMultiQR, setIsGeneratingMultiQR] = useState(false);
  const { isBlocked, isPenaltyActive, strikeCount } = useAntiCapture(tab === 'orders' || tab === 'history');

  const fetchAnnouncements = useCallback(async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    const annSub = supabase.channel('announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    // TC-080: Profile Realtime Sync
    const profileSub = supabase.channel('profile-sync')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'shops_profile',
        filter: `id=eq.${user?.id}`
      }, async (payload) => {
        const updatedProfile = payload.new as ShopProfile;
        setProfile(updatedProfile);
        await db.shopProfile.put(updatedProfile);
        toast.success(language === 'hi' ? 'प्रोफ़ाइल अपडेट हो गई!' : 'Profile updated live!');
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(annSub); 
      supabase.removeChannel(profileSub); 
    };
  }, [user?.id, language, fetchAnnouncements]);

  const handleSupport = () => {
    window.open('https://wa.me/917349141040?text=Hello%20Order-Do%20Support!', '_blank');
    haptics.light();
  };

  // Menu Management
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', category: '', description: '' });
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [isMenuSaving, setIsMenuSaving] = useState(false);

  // QR
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPendingCountRef = useRef(0);

  // Load profile
  useEffect(() => {
    const load = async () => {
      // 1. Run Privacy Audit (Cleanup) on load
      try {
          await performPrivacyAudit();
          await cleanupOldOrders(); // 30-day cloud cleanup
          await purgeStalePendingOrders(4); // Immediate session cleanup (4h)

          // 2. Check for Archival (Cloud -> CSV)
          const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
          const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
          const { count } = await supabase
            .from('pending_orders')
            .select('*', { count: 'exact', head: true })
            .lt('created_at', thirtyDaysAgo);

          if (count && count > 0) {
            toast(t('REPORT_ARCHIVE_READY'), {
              duration: 10000,
              icon: <ShieldAlert className="text-kirana-orange" />,
              action: {
                label: t('REPORT_ARCHIVE_ACTION'),
                onClick: async () => {
                  try {
                    await archiveAndCleanupCloudOrders();
                    speak(t('REPORT_ARCHIVE_SUCCESS'));
                    toast.success(t('REPORT_ARCHIVE_SUCCESS'));
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  } catch (err) {
                    toast.error('Archival failed');
                  }
                }
              }
            });
          }
      } catch (err) {
          console.warn('[Dashboard] Privacy audit failed:', err);
      }

      const profiles = await db.shopProfile.toArray();
      let p = profiles.find((x) => x.id === user?.id) || profiles[profiles.length - 1];
      
      if (!p && !user?.id) {
        return; 
      }

      if (!p) {
        const all = await db.shopProfile.toArray();
        if (all.length > 0) {
          p = all[all.length - 1];
        }
      }

      if (!p) {
        navigate('/shop/setup');
      } else {
        setProfile(p);
        
        // Load Menu (Sync Cloud -> Local)
        try {
          const { data: cloudItems } = await supabase
            .from('menu_items')
            .select('*')
            .eq('shop_id', user?.id);
          
          if (cloudItems && cloudItems.length > 0) {
            // Surgical Sync: Update local with cloud data without deleting local-only additions
            for (const ci of cloudItems) {
               const existing = await db.menuItems
                 .where('shopId').equals(p.shopId)
                 .and(m => m.name === ci.name)
                 .first();
               
               await db.menuItems.put({
                 ...ci,
                 id: existing?.id, // Preserve local ID for auto-increment consistency
                 shopId: p!.shopId,
                 available: ci.available !== false
               });
            }
            const finalItems = await db.menuItems.where('shopId').equals(p.shopId).toArray();
            setMenuItems(finalItems);
          } else {
            // If cloud is empty but local has data, sync local -> cloud
            const localItems = await db.menuItems.where('shopId').equals(p.shopId).toArray();
            if (localItems.length > 0 && user?.id) {
               await supabase.from('menu_items').insert(
                 // eslint-disable-next-line @typescript-eslint/no-unused-vars
                 localItems.map(({ id, ...item }) => ({
                   ...item,
                   shop_id: user.id
                 }))
               );
            }
            setMenuItems(localItems);
          }
        } catch (mErr) {
          console.error('[Dashboard] Menu sync failed:', mErr);
          const items = await db.menuItems.where('shopId').equals(p.shopId).toArray();
          setMenuItems(items);
        }
        
        const welcomeText = language === 'hi' 
          ? `Namaste! ${p.shopName} mein swagat hai.` 
          : `Welcome to ${p.shopName}!`;
          
        toast(welcomeText, { icon: <Sparkles className="text-kirana-green" /> });
        speak(welcomeText);
      }
      setLoading(false);
    };
    load();
  }, [user, navigate, language, t, speak]);

  // Refresh
  const refreshOrders = useCallback(async () => {
    if (!profile) return;
    const p = await db.pendingOrders
      .where('shopId')
      .equals(profile.shopId)
      .reverse()
      .sortBy('createdAt');
    
    // Decrypt names for display (Async)
    const decryptedP = await Promise.all(p.map(async (o) => ({
      ...o,
      decryptedName: o.customerName === 'DELETED_FOR_PRIVACY' ? 'Customer' : await decrypt(o.customerName, profile.shopId)
    })));

    if (autoAnnounce && decryptedP.length > lastPendingCountRef.current && lastPendingCountRef.current > 0) {
      const newest = decryptedP[0] as any;
      if (newest) {
        playNotification();
        haptics.warning();
        const customerNameDisplay = newest.decryptedName;
        const orderAlertText = language === 'hi' 
          ? `Naya order aaya hai! ऑडर्र नंबर ${newest.short_id || ''} ${customerNameDisplay} ने भेजा है।` 
          : `New order #${newest.short_id || ''} arrived from ${customerNameDisplay}!`;
          
        announceOrder(customerNameDisplay, newest.items, newest.short_id || 'NEW', newest.type, newest.no);
        toast(orderAlertText, { icon: <Bell className="text-kirana-orange" /> });
      }
    }
    lastPendingCountRef.current = decryptedP.length;
    setPending(decryptedP as any[]);

    const h = await db.orderHistory
      .where('shopId')
      .equals(profile.shopId)
      .reverse()
      .sortBy('completedAt');

    // Decrypt history names
    const decryptedH = await Promise.all(h.map(async (o) => ({
      ...o,
      decryptedName: o.customerName === 'DELETED_FOR_PRIVACY' ? 'Customer' : await decrypt(o.customerName, profile.shopId)
    })));

    setHistory(decryptedH as any[]);
  }, [profile, autoAnnounce, playNotification, language, announceOrder]);

  const filteredHistory = useMemo(() => {
    return history.filter((h: any) => {
      const isStatusMatch = historyFilter === 'all' || h.status === historyFilter;
      if (!isStatusMatch) return false;

      if (!historySearch) return true;
      const term = historySearch.toLowerCase();
      const customerNameDisplay = h.decryptedName?.toLowerCase() || '';
      const itemsMatch = h.items.some((i: any) => i.name.toLowerCase().includes(term));
      const idMatch = h.id.toLowerCase().includes(term) || (h.orderToken && h.orderToken.toLowerCase().includes(term));
      
      return customerNameDisplay.includes(term) || itemsMatch || idMatch;
    });
  }, [history, historySearch, historyFilter]);

  useEffect(() => {
    if (!profile) return;
    refreshOrders();
    
    // Real-time Cloud Sync
    const channel = supabase.channel(`dashboard-orders-${profile.shopId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pending_orders',
        filter: `shop_id=eq.${profile.shopId}`
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const cloudOrder = payload.new as any;
          // Sync to local Dexie
          await db.pendingOrders.put({
            id: cloudOrder.id,
            shopId: cloudOrder.shop_id,
            customerName: cloudOrder.customer_name,
            customerAddress: cloudOrder.customer_address,
            customerPhone: cloudOrder.customer_phone,
            photoDataUrl: cloudOrder.photo_data_url,
            items: cloudOrder.items,
            createdAt: new Date(cloudOrder.created_at).getTime(),
            status: cloudOrder.status,
            type: cloudOrder.type,
            no: cloudOrder.no,
            paymentStatus: cloudOrder.payment_status,
            paymentReceived: cloudOrder.payment_received,
          });
          refreshOrders();
        } else {
          refreshOrders();
        }
      })
      .subscribe();

    const interval = setInterval(refreshOrders, 5000); // Polling as fallback (5s)
    
    // Privacy Interval: Force purge stale data every 15 minutes
    const privacyInterval = setInterval(() => {
        purgeStalePendingOrders(6);
    }, 15 * 60 * 1000);
    
    return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
        clearInterval(privacyInterval);
    };
  }, [profile, refreshOrders]);

  // Menu actions
  const handleAddMenuItem = async () => {
    if (!profile || !user || !newMenuItem.name || !newMenuItem.price || isMenuSaving) return;
    setIsMenuSaving(true);
    try {
      const itemData = {
        shopId: profile.shopId,
        name: newMenuItem.name,
        price: parseFloat(newMenuItem.price),
        description: newMenuItem.description || undefined,
        category: newMenuItem.category || undefined,
        available: true
      };
      
      // 1. Add to Cloud
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{ ...itemData, shop_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;

      // 2. Add to Local
      await db.menuItems.add({ ...itemData, id: data.id });
      setMenuItems([...menuItems, { ...itemData, id: data.id }]);
      setNewMenuItem({ name: '', price: '', category: '', description: '' });
      setIsAddingMenu(false);
      toast.success(t('setup.menu.saveMenu') || 'Item added');
      haptics.success();
    } catch (err) {
      console.error(err);
      toast.error('Error adding item');
    } finally {
      setIsMenuSaving(true);
      setTimeout(() => setIsMenuSaving(false), 2000); // 2 second debounce
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
       // Delete from cloud
       await supabase.from('menu_items').delete().eq('id', id);
       // Delete from local
       await db.menuItems.delete(id);
       setMenuItems(menuItems.filter(m => m.id !== id));
       toast.success('Item removed');
       haptics.warning();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
       toast.error('Delete failed');
    }
  };

  const toggleMenuItemAvailability = async (item: MenuItem) => {
    if (!item.id) return;
    const newStatus = !item.available;
    try {
       // Optimistic update
       setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, available: newStatus } : m));
       
       // Update cloud
       const { error } = await supabase
         .from('menu_items')
         .update({ available: newStatus })
         .eq('id', item.id);
       
       if (error) throw error;

       // Update local
       await db.menuItems.update(item.id, { available: newStatus });
       haptics.light();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
       toast.error('Sync failed');
       // Rollback
       setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, available: item.available } : m));
    }
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
    let retryCount = 0;
    const maxRetries = 5;

    const render = () => {
      if (profile && tab === 'qr') {
        if (canvasRef.current) {
          const codeParam = profile.masterQrCode ? `&code=${profile.masterQrCode}` : '';
          const url = `${window.location.origin}/order?shop=${profile.shopId}${codeParam}`;
          QRCode.toCanvas(canvasRef.current, url, {
            width: 300,
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' },
          }, (err) => {
            if (err) console.error('[QR] Render failed:', err);
          });
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(render, 200);
        }
      }
    };

    render();
  }, [profile, tab]);

  // Order actions
  const handleUpdateStatus = async (orderId: string, status: 'pending' | 'accepted' | 'rejected' | 'ready') => {
    try {
      // 1. Update Supabase (Realtime bridge)
      const { error: syncError } = await supabase
        .from('pending_orders')
        .update({ status })
        .eq('id', orderId);

      if (syncError) throw syncError;

      // 2. Update local Dexie for offline consistency
      await db.pendingOrders.update(orderId, { status });
      
      toast.success(t('dashboard.statusUpdated'));
      haptics.light();
      await refreshOrders();
    } catch (err: any) {
      console.error('[Dashboard] Status Update Failed:', err);
      toast.error('Sync failed: ' + err.message);
    }
  };

  const handleOrderDone = async (order: PendingOrder, pricedItems: OrderItem[], total: number, paymentReceived: boolean) => {
    const customerNameDisplay = (order as any).decryptedName || 'Customer';
    
    // Create Proof and Delete Personal Data (New System)
    try {
        const result = await createProofAndDeletePersonalData(order.id, total);
        console.log(`[Dashboard] PrivacyProof success for ${order.id}. Token: ${result.orderToken}`);
        
        setSelectedOrder(null);
        toast.success(t('dashboard.orderComplete').replace('[name]', customerNameDisplay).replace('[total]', total.toString()));
        haptics.success();
        await refreshOrders();
    } catch (err) {
        console.error('[Dashboard] Error during order finalization:', err);
        toast.error('PrivacyProof generation failed. Still marking as done.');
        
        // Fallback: If proof generation fails, still mark it done in the old way
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
        await supabase.from('pending_orders').delete().eq('id', order.id);
        setSelectedOrder(null);
        toast.success(t('dashboard.orderComplete').replace('[name]', customerNameDisplay).replace('[total]', total.toString()));
        haptics.success();
        await refreshOrders();
    }
  };

  const handleOrderReject = async (order: PendingOrder) => {
    const customerNameDisplay = (order as any).decryptedName || 'Customer';
    if (!confirm(t('dashboard.rejectConfirm').replace('[name]', customerNameDisplay))) return;
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
    await supabase.from('pending_orders').delete().eq('id', order.id);
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

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <h2 className="text-xl font-bold mb-4">No Profile Found</h2>
        <p className="text-slate-500 mb-6">Please complete the setup first.</p>
        <Button onClick={() => navigate('/shop/setup')}>Go to Setup</Button>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refreshOrders}>
      <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-hidden text-white selection:bg-brand-primary/30">
        <ProtectionOverlay isVisible={isBlocked} />
        
        {/* Immersive Background Nodes */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-primary/5 blur-[120px] rounded-full -ml-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-secondary/5 blur-[120px] rounded-full -mr-20 -mb-20 pointer-events-none" />

        <header className="h-20 flex items-center px-4 md:px-8 bg-slate-900/40 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shadow-inner shrink-0 group hover:border-brand-primary/30 transition-colors">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow-glow" />
              </div>
              <div className="flex flex-col min-w-0">
                <SecureCanvas 
                  content={profile.shopName} 
                  width={200} 
                  height={24} 
                  fontSize={16} 
                  className="border-none bg-transparent font-black italic tracking-tighter text-white" 
                  tagline="Secure Identity"
                />
                <div className="flex items-center gap-2">
                  <SecureCanvas 
                    content={profile.shopId} 
                    width={150} 
                    height={16} 
                    fontSize={11} 
                    className="border-none bg-transparent opacity-40 font-bold" 
                    tagline="Secure ID"
                  />
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20">
                    <div className="w-1 h-1 rounded-full bg-brand-primary animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest">{subscription?.plan?.name || 'Free'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="hidden md:flex items-center gap-2 mr-4">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/shop/kds')} className="gap-2">
                     <UtensilsCrossed size={16} /> KDS
                  </Button>
                  {isAdmin && (
                    <Button variant="secondary" size="sm" onClick={() => navigate('/admin')} className="gap-2 shadow-glow-orange">
                       <Shield size={16} /> Admin
                    </Button>
                  )}
               </div>

               <div className="flex items-center gap-1 bg-white/5 dark:bg-slate-900/40 p-1 rounded-2xl border border-white/10">
                  <Button variant="ghost" size="sm" className="!p-0 w-10 h-10 rounded-xl" onClick={() => { setAutoAnnounce(!autoAnnounce); haptics.light(); }}>
                     {autoAnnounce ? <Bell size={18} className="text-brand-primary" /> : <BellOff size={18} className="text-slate-400" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="!p-0 w-10 h-10 rounded-xl text-brand-primary" onClick={() => setShowTutorial(true)}>
                     <HelpCircle size={18} />
                  </Button>
                  <LanguageSwitcher />
                  <Button variant="ghost" size="sm" className="!p-0 w-10 h-10 rounded-xl" onClick={toggleTheme}>
                     {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  </Button>
                  <Button variant="ghost" size="sm" className="!p-0 w-10 h-10 rounded-xl text-red-500" onClick={() => { logout(); navigate('/'); }}>
                     <LogOut size={18} />
                  </Button>
               </div>
            </div>
          </div>
        </header>


        {/* NEW: LIVE ANNOUNCEMENT BANNER */}
        <AnimatePresence>
          {announcements.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-slate-900 border-b border-slate-700/50 py-2 overflow-hidden flex items-center relative z-20"
            >
               <div className="flex items-center gap-2 px-4 shrink-0 border-r border-slate-700 mr-2">
                  <Megaphone size={14} className="text-kirana-green animate-bounce" />
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">Update</span>
               </div>
               <div className="flex-1 whitespace-nowrap overflow-hidden">
                  <div className="flex gap-12 animate-marquee inline-block">
                     {announcements.map((ann, i) => (
                        <div key={i} className="inline-flex items-center gap-2">
                           <span className={`w-1.5 h-1.5 rounded-full ${ann.priority === 'critical' ? 'bg-red-500' : ann.priority === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                           <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{ann.title}:</span>
                           <span className="text-[11px] font-medium text-slate-400 italic lowercase">{ann.message}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sticky top-[81px] z-40 bg-white/20 dark:bg-slate-900/20 backdrop-blur-3xl px-6 py-2 border-b border-white/10">
           <nav className="flex gap-2 overflow-x-auto no-scrollbar max-w-2xl mx-auto">
            {(['orders', 'history', 'menu', 'qr', 'report', 'settings'] as Tab[]).map((k) => {
              const Icon = k === 'orders' ? ListOrdered : k === 'history' ? History : k === 'menu' ? UtensilsCrossed : k === 'qr' ? QrCode : k === 'settings' ? Settings : TrendingUp;
              const isActive = tab === k;
              return (
                <button
                  key={k}
                  onClick={() => { setTab(k); haptics.light(); }}
                  className={`
                    flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                    ${isActive ? 'bg-brand-primary text-white shadow-glow-green scale-105' : 'bg-white/40 dark:bg-slate-900/40 text-slate-500 border border-white/10 hover:bg-white/60'}
                  `}
                >
                  <Icon size={16} />
                  <span>
                    {t(`dashboard.${k}` as any) || k.toUpperCase()}
                  </span>
                  {k === 'orders' && pending.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${isActive ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white'}`}>{pending.length}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto px-4 pb-24 relative z-10">
          <div className="max-w-xl mx-auto py-4">
              {/* Premium Dashboard Stats */}
              {!subLoading && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <GlassCard intensity="high" className="p-6 relative overflow-hidden group">
                     <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Today's Sales</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1 break-all">
                           <span className="text-sm">₹</span>
                           {history.filter(h => new Date(h.completedAt).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + o.total, 0)}
                        </h3>
                     </div>
                     <div className="absolute -bottom-4 -right-4 bg-brand-primary/10 p-6 rounded-full group-hover:scale-110 transition-transform">
                        <TrendingUp size={48} className="text-brand-primary/20" />
                     </div>
                  </GlassCard>

                  <GlassCard intensity="high" className="p-6 relative overflow-hidden group">
                     <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Pending Orders</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white break-all">
                           {pending.length}
                        </h3>
                     </div>
                     <div className="absolute -bottom-4 -right-4 bg-brand-secondary/10 p-6 rounded-full group-hover:scale-110 transition-transform">
                        <PackageOpen size={48} className="text-brand-secondary/20" />
                     </div>
                  </GlassCard>

                  <GlassCard intensity="medium" className="col-span-2 p-6 flex items-center justify-between border-brand-primary/20 bg-brand-primary/5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${!subscription || isExpired(subscription.expiry_date) ? 'bg-red-500' : isExpiringSoon(subscription.expiry_date) ? 'bg-amber-500' : 'bg-brand-primary'} text-white shadow-xl`}>
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight italic">
                           {!subscription ? 'No Plan Active' : isExpired(subscription.expiry_date) ? 'Plan Expired' : `${subscription.plan.name} License Active`}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                           Expires: {subscription ? getFormattedRemainingTime(subscription.expiry_date, language) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {(!subscription || isExpired(subscription.expiry_date)) && (
                       <Button size="sm" variant="primary" onClick={handleSupport} className="shadow-glow-green">Renew</Button>
                    )}
                  </GlassCard>
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === 'orders' && (
                    <div className="space-y-4">
                      {pending.length === 0 ? (
                        <div className="flex flex-col items-center py-20 text-center">
                          <div className="w-24 h-24 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center mb-6 border border-brand-primary/20">
                             <PackageOpen size={48} className="text-brand-primary/40" />
                          </div>
                          <h3 className="text-lg font-black uppercase tracking-tight mb-2">Sannatta Hai...</h3>
                          <p className="text-slate-400 text-sm font-medium italic max-w-[200px]">{t('dashboard.noPendingOrders')}</p>
                        </div>
                      ) : (
                        pending.map((o) => (
                          <OrderCard 
                            key={o.id} 
                            order={o} 
                            onClick={() => { setSelectedOrder(o); haptics.light(); }} 
                            shopName={profile.shopName}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {tab === 'history' && (
                    <div className="space-y-4">
                      {/* Search & Filter Header */}
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
                         <div className="relative">
                            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-kirana-orange opacity-50" size={18} />
                            <input 
                              type="text"
                              value={historySearch}
                              onChange={(e) => setHistorySearch(e.target.value)}
                              placeholder={language === 'hi' ? 'नाम, आइटम या टोकन से खोजें...' : 'Search by name, item or token...'}
                              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-kirana-green/30 rounded-2xl outline-none text-sm transition-all font-bold"
                            />
                         </div>
                         <div className="flex gap-2">
                            {(['all', 'completed', 'rejected'] as const).map((f) => (
                               <button 
                                 key={f}
                                 onClick={() => setHistoryFilter(f)}
                                 className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                   historyFilter === f 
                                     ? 'bg-kirana-green border-kirana-green text-white shadow-lg shadow-kirana-green/20' 
                                     : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                                 }`}
                               >
                                 {f === 'all' ? (language === 'hi' ? 'सब' : 'All') : f === 'completed' ? (language === 'hi' ? 'पूरे' : 'Done') : (language === 'hi' ? 'रद्द' : 'Rejected')}
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-3">
                        {filteredHistory.length === 0 ? (
                          <div className="flex flex-col items-center py-16 text-center text-slate-400">
                             <PackageOpen size={48} className="mb-4 opacity-10" />
                             <p>{history.length === 0 ? t('dashboard.noHistory') : (language === 'hi' ? 'कोई परिणाम नहीं मिला' : 'No matches found')}</p>
                          </div>
                        ) : (
                          filteredHistory.map((h: any) => {
                            const isPrivacyProtected = h.photoDataUrl === 'DELETED_FOR_PRIVACY' || h.photoDataUrl === 'DELETED_BY_AUDIT';
                            const displayPhoto = isPrivacyProtected ? h.proofBlurredPhoto : h.photoDataUrl;
                            const displayName = isPrivacyProtected ? '🛡️ Privacy Proof' : (h.decryptedName || 'Customer');
                            
                            return (
                              <div 
                                key={h.id} 
                                onClick={() => { setSelectedHistoryOrder(h); haptics.light(); }}
                                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between cursor-pointer active:scale-98 transition-all hover:border-kirana-green/30"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-100 dark:border-slate-600">
                                    {(displayPhoto) && <SecureCanvas image={displayPhoto} width={100} height={100} className="w-full h-full border-none" tagline="S" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <SecureCanvas content={displayName} width={140} height={20} fontSize={14} className="border-none bg-transparent" />
                                      {isPrivacyProtected && (
                                        <span className="text-[7px] font-black uppercase text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20">PROOF</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium font-mono">{new Date(h.completedAt).toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className={`flex flex-col items-end gap-1`}>
                                   <div className="flex items-center gap-1 font-black text-kirana-green">
                                     <IndianRupee size={12} /> {h.total}
                                   </div>
                                   {h.status === 'rejected' && (
                                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">REJECTED</span>
                                   )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {tab === 'qr' && (
                    <div className="space-y-6">
                      {/* Smart Dev Helper for Local Testing */}
                      {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                        <motion.div 
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-amber-500/10 border-2 border-amber-500/30 p-5 rounded-[2rem] text-left space-y-3"
                        >
                          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest text-[10px]">
                            <Sparkles size={14} /> Dev Helper: Mobile Connection
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
                            {language === 'hi' 
                              ? 'मोबाइल से जोड़ने के लिए "Network" वाले लिंक का उपयोग करें।' 
                              : 'Use the "Network" link to connect your mobile phone.'}
                          </p>
                          <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl space-y-2">
                             <p className="text-[10px] font-bold text-slate-500">1. Terminal में ये टाइप करें:</p>
                             <code className="block bg-black text-kirana-green p-2 rounded-lg text-[10px] font-mono">npm run dev -- --host</code>
                             <p className="text-[10px] font-bold text-slate-500">2. अब लैपटॉप में "Network" वाला लिंक खोलें।</p>
                          </div>
                        </motion.div>
                      )}

                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-lg border text-center flex flex-col items-center">
                        <canvas ref={canvasRef} className="rounded-[1.5rem] shadow-xl mb-4 p-2 bg-white" />
                        <div className="mb-6 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Unique Shop ID</span>
                          <SecureCanvas 
                            content={profile.shopId} 
                            width={220} 
                            height={24} 
                            fontSize={14} 
                            className="border-none bg-transparent font-mono" 
                            tagline="ID"
                            textAlign="center"
                          />
                        </div>
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
                             <Button onClick={handleAddMenuItem} isLoading={isMenuSaving}>Add</Button>
                          </div>
                        </div>
                      )}
                      <div className="space-y-3">
                        {menuItems.map(m => (
                          <div key={m.id} className={`bg-white dark:bg-slate-800 p-4 rounded-2xl border ${m.available ? 'border-slate-100 dark:border-slate-700' : 'border-red-100 dark:border-red-900/30 opacity-60'} flex items-center justify-between group transition-all`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`font-bold truncate ${!m.available && 'text-slate-400'}`}>{m.name}</p>
                                {m.category && (
                                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500 uppercase tracking-tighter">
                                    {m.category}
                                  </span>
                                )}
                                {!m.available && (
                                  <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    Out of Stock
                                  </span>
                                )}
                              </div>
                              {m.description && (
                                <p className="text-xs text-slate-400 line-clamp-1 mb-1">{m.description}</p>
                              )}
                              <p className={`text-sm font-bold ${m.available ? 'text-kirana-green' : 'text-slate-400'}`}>₹{m.price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasFeature('smart_inventory') ? (
                                <button 
                                  onClick={() => toggleMenuItemAvailability(m)}
                                  className={`p-2 rounded-xl transition-all ${m.available ? 'bg-kirana-green/10 text-kirana-green' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
                                  title={m.available ? 'Mark Unavailable' : 'Mark Available'}
                                >
                                  <PackageOpen size={18} className={m.available ? '' : 'opacity-40'} />
                                </button>
                              ) : (
                                <div 
                                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-300 cursor-not-allowed opacity-50"
                                  title="Upgrade to Elite for Smart Inventory"
                                >
                                  <Lock size={16} />
                                </div>
                              )}
                               <button onClick={() => m.id && handleDeleteMenuItem(m.id as number)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                 <Trash2 size={18} />
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab === 'settings' && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <Settings className="text-kirana-orange" />
                          App Settings
                        </h2>
                        <VoiceSettings />
                      </div>

                      {/* Security & Data Section */}
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <ShieldCheck size={14} className="text-kirana-green" />
                          {language === 'hi' ? 'सुरक्षा और डेटा' : 'Security & Data'}
                        </h3>
                        <div className="space-y-4">
                           <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                             {language === 'hi' 
                               ? 'अपनी गोपनीयता की रक्षा के लिए 30 दिन से पुराने क्लाउड डेटा को वाइप करें। डेटा आपके स्थानीय डिवाइस पर सुरक्षित रहेगा।' 
                               : 'Wipe cloud data older than 30 days to protect your privacy. Data remains safe on your local device.'}
                           </p>
                           <button 
                             onClick={async () => {
                               try {
                                 const { count } = await archiveAndCleanupCloudOrders();
                                 if (count === 0) {
                                   toast(t('REPORT_ARCHIVE_EMPTY'));
                                 } else {
                                   toast.success(t('REPORT_ARCHIVE_SUCCESS'));
                                   speak(t('REPORT_ARCHIVE_SUCCESS'));
                                 }
                               // eslint-disable-next-line @typescript-eslint/no-unused-vars
                               } catch (err) {
                                 toast.error('Archival failed');
                               }
                             }}
                             className="w-full py-4 bg-kirana-orange/10 text-kirana-orange rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 border border-kirana-orange/20 hover:bg-kirana-orange/20 transition-all font-bold"
                           >
                             <Download size={16} />
                             {t('REPORT_ARCHIVE_ACTION')} & {language === 'hi' ? 'क्लाउड साफ़ करें' : 'Clean Cloud'}
                           </button>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Shop Profile</h3>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700">
                              <span className="text-xs text-slate-500">Shop Name</span>
                              <span className="text-xs font-bold">{profile.shopName}</span>
                           </div>
                           <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700">
                              <span className="text-xs text-slate-500">Shop ID</span>
                              <span className="text-xs font-mono font-bold text-kirana-green">{profile.shopId}</span>
                           </div>
                           
                           {/* Updated Subscription Section */}
                           <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-2">
                                    <Sparkles size={16} className="text-kirana-orange" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subscription Status</span>
                                 </div>
                                 <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${subscription?.status === 'active' ? 'bg-kirana-green/10 text-kirana-green' : 'bg-red-500/10 text-red-500'}`}>
                                    {subscription?.status || 'Inactive'}
                                 </span>
                              </div>
                              <div className="space-y-3">
                                 <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400">Current Plan</span>
                                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase italic">{subscription?.plan?.name || 'Free Tier'}</span>
                                 </div>
                                 {subscription?.confirmed_at && (
                                   <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                                      <span className="text-xs font-bold text-slate-400">Activated On</span>
                                      <span className="text-xs font-black text-kirana-green">
                                        {new Date(subscription.confirmed_at).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                      </span>
                                   </div>
                                 )}
                                 {subscription?.expiry_date && (
                                   <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                                      <span className="text-xs font-bold text-slate-400">Expiry Duration</span>
                                      <span className="text-xs font-black text-slate-800 dark:text-white">
                                        {new Date(subscription.expiry_date).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                      </span>
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Device Management Section */}
                      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-700 lg:col-span-2">
                        <SessionManager />
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
              <AdBanner slot="dashboard_sidebar" className="mt-8 mb-4 max-w-sm mx-auto" isPremium={subscription?.plan?.name !== 'Free'} />
          </div>
        </main>

        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onDone={handleOrderDone}
            onReject={handleOrderReject}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {selectedHistoryOrder && (
          <ProofModal
            order={selectedHistoryOrder}
            onClose={() => setSelectedHistoryOrder(null)}
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

        {/* Security Overlays */}
        {isBlocked && !isPenaltyActive && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl transition-all duration-300">
             <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20 flex flex-col items-center text-center max-w-sm">
                <div className="w-20 h-20 rounded-2xl bg-red-500 flex items-center justify-center mb-6 animate-pulse">
                   <Lock size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Capture Detected</h2>
                <p className="text-red-400 text-sm font-bold leading-relaxed mb-6">
                   Warning: Screenshots and screen recordings are strictly prohibited to protect customer privacy.
                </p>
                <div className="px-4 py-2 bg-slate-800 rounded-lg text-slate-500 text-[10px] font-black uppercase tracking-widest">
                   Strike {strikeCount} of 3
                </div>
             </div>
          </div>
        )}

        {isPenaltyActive && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-red-950 backdrop-blur-3xl transition-all duration-500">
             <div className="p-10 rounded-[2.5rem] bg-black/40 border-2 border-red-500/30 flex flex-col items-center text-center max-w-md shadow-2xl">
                <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center mb-8 shadow-lg shadow-red-600/40 animate-bounce">
                   <ShieldAlert size={48} className="text-white" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Account Locked</h2>
                <p className="text-red-300 text-lg font-bold leading-relaxed mb-8">
                   Multiple security violations detected. Your dashboard has been locked for 10 minutes for data protection.
                </p>
                <div className="flex items-center gap-3 px-6 py-3 bg-red-500/20 rounded-2xl border border-red-500/30">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                   <span className="text-red-400 text-xs font-black uppercase tracking-[0.2em]">Forensic Lock Active</span>
                </div>
             </div>
          </div>
        )}

        {/* Magic Assistant Floating Orb */}
        <div className="fixed bottom-24 right-6 z-50">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={handleAssistantVoice}
            className={`
              relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl overflow-hidden
              ${isAssistantListening ? 'bg-brand-secondary' : 'bg-slate-950'}
            `}
          >
            <span className="font-bold text-sm tracking-tight">{isAssistantListening ? '...' : 'Chhotididi'}</span>
          </motion.button>
        </div>
        <ShopTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
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
