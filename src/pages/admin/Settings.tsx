import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Gift, 
  Key,
  Globe,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Activity,
  RotateCcw,
  Sparkles,
  CloudLightning,
  Terminal,
  Fingerprint,
  Eye,
  EyeOff,
  Save,
  ShieldQuestion,
  Download
} from 'lucide-react';
import { generateRecoveryCardText, downloadRecoveryCard } from '../../utils/recovery';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import { useVoice } from '../../context/VoiceContext';

export default function AdminSettings() {
  const [globalFree, setGlobalFree] = useState(false);
  const [publicAccess, setPublicAccess] = useState(true);
  const [showAds, setShowAds] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Master PIN State
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [shopProfile, setShopProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, profileRes, authRes] = await Promise.all([
          supabase.from('admin_settings').select('*'),
          supabase.from('shops_profile').select('*').eq('role', 'admin').single(),
          supabase.auth.getUser()
        ]);

        if (settingsRes.data) {
          const settings = settingsRes.data;
          const freeMode = settings.find(s => s.key === 'global_free_toggle');
          const pAccess = settings.find(s => s.key === 'maintenance_mode');
          const adsToggle = settings.find(s => s.key === 'show_ads');
          
          if (freeMode) setGlobalFree(freeMode.value === true || freeMode.value === 'true');
          if (pAccess) setPublicAccess(pAccess.value === true || pAccess.value === 'true');
          if (adsToggle) setShowAds(adsToggle.value === true || adsToggle.value === 'true');
        }

        if (profileRes.data && authRes.data.user) {
          setShopProfile({
            ...profileRes.data,
            email: authRes.data.user.email
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    const channel = supabase.channel('admin-settings-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_settings' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleGlobalFree = async () => {
    const newValue = !globalFree;
    const { error } = await supabase.from('admin_settings').upsert(
      { key: 'global_free_toggle', value: newValue },
      { onConflict: 'key' }
    );

    if (error) {
      toast.error('Protocol Update Failed: Database Reject');
      return;
    }

    setGlobalFree(newValue);
    toast.success(newValue ? 'Global Access Granted: Zero Cost Mode' : 'Standard Licensing Restored');
  };

  const togglePublicAccess = async () => {
    const newValue = !publicAccess;
    const { error } = await supabase.from('admin_settings').upsert(
      { key: 'maintenance_mode', value: newValue },
      { onConflict: 'key' }
    );

    if (error) {
       toast.error('Nexus Link Failed');
       return;
    }

    setPublicAccess(newValue);
    toast.success(newValue ? 'Public Network Link: ACTIVE' : 'Maintenance Protocol: ON');
  };

  const toggleShowAds = async () => {
    const newValue = !showAds;
    const { error } = await supabase.from('admin_settings').upsert(
      { key: 'show_ads', value: newValue },
      { onConflict: 'key' }
    );

    if (error) {
      toast.error('Monetization Sync Failed');
      return;
    }

    setShowAds(newValue);
    toast.success(newValue ? 'Revenue Streams: ON' : 'Ads Suppression: ACTIVE');
  };

  const rotateApiKey = () => {
    toast.error('Critical Authorization Required: Security Protocol 401');
  };

  const handleUpdatePin = async () => {
    if (!newPin || newPin.length !== 6) {
      toast.error('Insecure Input: PIN must be exactly 6 digits for protocol safety');
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('Synchronization Error: PINs do not match');
      return;
    }

    setIsUpdatingPin(true);
    try {
      const { error } = await supabase.rpc('set_admin_pin', { new_pin: newPin });
      
      if (error) throw error;

      toast.success('Security Protocol Updated: Master PIN Synchronized', {
        icon: <ShieldCheck className="text-brand-primary" />
      });
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      console.error('PIN Update Failure:', err);
      toast.error('Protocol Rejection: ' + err.message);
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const handleDownloadRecovery = () => {
    if (!shopProfile) {
      toast.error('Sync Failure: Metadata not yet synchronized');
      return;
    }

    const content = generateRecoveryCardText({
      shopName: shopProfile.shop_name,
      shopId: shopProfile.shop_id,
      ownerEmail: shopProfile.email,
      projectRef: 'qmeyotlilhwzcchdwhid' // Standard for this project
    });

    downloadRecoveryCard(content, shopProfile.shop_name);
    toast.success('Protocol Downloaded: Store this card in a physical vault!', {
      icon: <Download className="text-brand-secondary" />
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-40">
       <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin mb-6" />
       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Initializing System Configuration...</p>
    </div>
  );

   return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <motion.h1 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none"
           >
             Core <span className="text-brand-primary">Config</span>
           </motion.h1>
           <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 flex items-center gap-2">
             <Cpu size={12} className="text-brand-primary" />
             Global System Parameters & Security Protocols
           </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-brand-primary/20 flex items-center gap-2">
              <Activity size={10} />
              System Status: Nominal
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* GLOBAL FREE MODE - FEATURE CARD */}
        <div className="lg:col-span-12 xl:col-span-5">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={toggleGlobalFree}
            className="cursor-pointer group h-full"
          >
            <GlassCard 
              intensity="high" 
              className={`p-10 border-2 transition-all duration-700 h-full flex flex-col justify-between overflow-hidden relative ${
                globalFree 
                  ? 'border-brand-primary/40 shadow-glow-green/30' 
                  : 'border-white/10 dark:border-white/5 opacity-80 hover:opacity-100'
              }`}
            >
               <div className="relative z-10">
                  <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-8 transition-all duration-700 shadow-2xl ${
                    globalFree ? 'bg-white text-brand-primary' : 'bg-white/10 text-slate-400'
                  }`}>
                     <Gift size={40} className={globalFree ? 'animate-bounce' : ''} />
                  </div>
                  
                  <h2 className={`text-3xl font-black uppercase tracking-tighter italic leading-none mb-4 transition-colors duration-700 ${
                    globalFree ? 'text-brand-primary' : 'text-slate-900 dark:text-white'
                  }`}>
                    Omni-Free Access
                  </h2>
                  <p className={`text-xs font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-sm transition-colors duration-700 ${
                    globalFree ? 'text-brand-primary/80' : 'text-slate-500'
                  }`}>
                    Unlock unrestricted premium access for the entire global network. Bypassing all subscription gating protocols for promotional events.
                  </p>
               </div>

               <div className="relative z-10 flex items-end justify-between">
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-700 ${
                    globalFree ? 'bg-brand-primary text-white border-brand-primary' : 'bg-transparent text-slate-400 border-white/20'
                  }`}>
                     {globalFree ? 'Network Wide: Active' : 'Protocol: Standard'}
                  </div>
                  
                  <div className={`h-10 w-20 rounded-full p-1.5 transition-all duration-700 flex items-center shadow-inner ${
                    globalFree ? 'bg-brand-primary' : 'bg-slate-200 dark:bg-slate-800'
                  }`}>
                     <motion.div 
                        animate={{ x: globalFree ? 40 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-7 h-7 bg-white rounded-full shadow-2xl" 
                     />
                  </div>
               </div>

               {/* Background effects */}
               <AnimatePresence>
                  {globalFree && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-brand-primary/5 pointer-events-none"
                    >
                       <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-primary/10 blur-[100px] rounded-full" />
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent" />
                    </motion.div>
                  )}
               </AnimatePresence>
            </GlassCard>
          </motion.div>
        </div>

        {/* SECURITY & MAINTENANCE COMMANDS */}
        <div className="lg:col-span-12 xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
           <GlassCard intensity="low" className="p-8 border-white/20 dark:border-white/5 space-y-8 flex flex-col justify-between">
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                       <ShieldCheck size={14} className="text-brand-primary" /> Security Hub
                    </h3>
                    <div className="w-2 h-2 rounded-full bg-brand-primary shadow-glow-green animate-pulse" />
                 </div>
                 
                 <div className="space-y-4">
                    <SettingsItem 
                      icon={Globe} 
                      label="Network Visibility" 
                      sub="Access link to public" 
                      active={publicAccess} 
                      onClick={togglePublicAccess} 
                    />
                    <SettingsItem 
                      icon={CloudLightning} 
                      label="Ad Engine Relay" 
                      sub="Monetization stream" 
                      active={showAds} 
                      onClick={toggleShowAds} 
                    />
                 </div>
              </div>

              <div className="p-6 bg-brand-primary/5 rounded-[2rem] border border-brand-primary/10 flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Authorization Hash</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">SHA-256 Protocol Verified</p>
                 </div>
                 <Button variant="ghost" className="h-10 px-4 !rounded-xl bg-white/10 border border-white/10 text-[9px] font-black text-slate-500 uppercase">
                    Audit
                 </Button>
              </div>
           </GlassCard>

            <GlassCard intensity="low" className="p-8 border-white/20 dark:border-white/5 space-y-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/5 blur-[50px] rounded-full pointer-events-none" />
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                       <Fingerprint size={14} className="text-brand-secondary" /> Master Security
                    </h3>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Encrypted (Bcrypt)</span>
                 </div>
                 
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest">
                       Set the global Master PIN for vault access. This PIN is hashed using Bcrypt on the server.
                    </p>
                    
                    <div className="space-y-3">
                       <div className="relative group">
                          <input 
                            type={showPin ? 'text' : 'password'}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="6-digit Master PIN..."
                            className="w-full h-14 bg-white/10 dark:bg-slate-950/50 border-2 border-white/10 dark:border-white/5 rounded-2xl px-6 text-sm font-black tracking-[0.3em] outline-none focus:border-brand-secondary/50 transition-all placeholder:text-slate-500/30 placeholder:tracking-normal"
                          />
                          <button 
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-4 top-4 text-slate-500 hover:text-brand-secondary transition-colors"
                          >
                             {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                       </div>

                       <input 
                         type={showPin ? 'text' : 'password'}
                         value={confirmPin}
                         onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                         placeholder="Confirm Secret..."
                         className="w-full h-14 bg-white/10 dark:bg-slate-950/50 border-2 border-white/10 dark:border-white/5 rounded-2xl px-6 text-sm font-black tracking-[0.3em] outline-none focus:border-brand-secondary/50 transition-all placeholder:text-slate-500/30 placeholder:tracking-normal"
                       />

                       <div className="grid grid-cols-2 gap-3">
                          <Button 
                            onClick={handleUpdatePin}
                            isLoading={isUpdatingPin}
                            className="h-14 !rounded-2xl shadow-glow-secondary/20"
                            variant="primary"
                          >
                             <Save size={14} className="mr-2" /> Sync
                          </Button>
                          <VoiceTestButton />
                       </div>
                    </div>
                  </div>
              </div>

              <div className="p-5 bg-red-500/5 rounded-2xl border border-red-500/10 flex items-start gap-4">
                 <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
                 <p className="text-[9px] font-bold text-red-500/70 uppercase leading-tight tracking-widest">
                    WARNING: Updating this secret will immediately invalidate the previous Master Protocol. Existing vault sessions will require sync.
                 </p>
              </div>
            </GlassCard>

            <GlassCard intensity="low" className="p-8 border-white/20 dark:border-white/5 space-y-8 flex flex-col justify-between">
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Key size={14} className="text-brand-primary" /> API Handshake
                     </h3>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">RSA-4096</span>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="p-6 bg-white/20 dark:bg-slate-950/40 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-inner group">
                        <div className="flex items-start justify-between mb-4">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Project Reference</label>
                           <div className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-[7px] font-black">ACTIVE</div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex-1 font-mono text-xs font-black text-slate-800 dark:text-slate-200 tracking-widest opacity-40 group-hover:opacity-100 transition-opacity truncate">
                              ORDERDO-MAIN-NEXUS-01
                           </div>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={rotateApiKey}
                             className="w-10 h-10 !p-0 !rounded-xl bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-glow-green/10"
                           >
                              <RotateCcw size={16} />
                           </Button>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <ActionButton icon={Terminal} label="System Logs" />
                         <ActionButton icon={Sparkles} label="Reset Cache" accent="brand-primary" />
                     </div>
                  </div>
               </div>

               <p className="text-[8px] font-bold text-slate-400 uppercase text-center tracking-widest opacity-60 italic">
                  Manual override of system parameters requires level-4 synchronization
               </p>
            </GlassCard>

            {/* EMERGENCY RECOVERY CARD */}
            <GlassCard 
              intensity="low" 
              className="p-8 border-white/20 dark:border-white/5 bg-brand-primary/5 relative overflow-hidden flex flex-col justify-between"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-[50px] rounded-full pointer-events-none" />
               <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                        <ShieldQuestion size={14} className="text-brand-primary" /> Disaster Recovery
                     </h3>
                     <span className="text-[8px] font-black text-brand-primary uppercase tracking-widest px-2 py-0.5 bg-brand-primary/10 rounded">OFFLINE BACKUP</span>
                  </div>
                  
                  <div className="space-y-4">
                     <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest">
                        Download your one-time Emergency Recovery Card. This contains instructions to reset your PIN via the database if you are locked out.
                     </p>
                     
                     <Button 
                        onClick={handleDownloadRecovery}
                        className="w-full h-14 !rounded-2xl border-2 border-brand-primary/20 bg-brand-primary/5 hover:bg-brand-primary hover:text-white transition-all group shadow-glow-green/10"
                        variant="ghost"
                     >
                        <Download size={18} className="mr-3 group-hover:animate-bounce" />
                        Generate Recovery Card (.txt)
                     </Button>
                  </div>
               </div>

               <p className="mt-6 text-[8px] font-bold text-slate-400 uppercase text-center tracking-widest opacity-60 italic leading-loose">
                  KEEP THIS FILE OFFLINE. DO NOT STORAGE ON PUBLIC CLOUDS. <br/>
                  IT CONTAINS THE PROTOCOL FOR SYSTEM-WIDE PIN OVERRIDE.
               </p>
            </GlassCard>
         </div>
      </div>
    </div>
  );
}

function SettingsItem({ icon: Icon, label, sub, active, onClick }: any) {
  return (
    <div 
      className="flex items-center justify-between p-5 bg-white/20 dark:bg-slate-950/40 backdrop-blur-md rounded-[2rem] border border-white/10 cursor-pointer hover:border-brand-primary/30 transition-all group"
      onClick={onClick}
    >
       <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            active ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-glow-green/10' : 'bg-white/10 text-slate-400 border border-white/10'
          }`}>
             <Icon size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest transition-colors group-hover:text-brand-primary">{label}</h4>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{sub}</p>
          </div>
       </div>
       <div className={`h-8 w-14 rounded-full p-1 transition-all flex items-center shadow-inner ${
          active ? 'bg-brand-primary/40 text-brand-primary' : 'bg-slate-200 dark:bg-slate-800'
       }`}>
          <motion.div 
             animate={{ x: active ? 22 : 0 }}
             className="w-6 h-6 bg-white rounded-full shadow-lg" 
          />
       </div>
    </div>
  );
}

function VoiceTestButton() {
  const { speak, isSpeaking, stop } = useVoice();
  
  return (
    <Button 
      variant="ghost" 
      onClick={() => isSpeaking ? stop() : speak("Hello Admin, Dhara AI voice engine is online and ready for orders.")}
      className={`h-14 !rounded-2xl border-2 transition-all ${isSpeaking ? 'border-brand-primary bg-brand-primary/10' : 'border-white/10'}`}
    >
       <ActivityIcon size={14} className={`mr-2 ${isSpeaking ? 'animate-pulse text-brand-primary' : ''}`} />
       {isSpeaking ? 'Stop Test' : 'Test Voice'}
    </Button>
  );
}

function ActionButton({ icon: Icon, label, accent = "slate-400" }: any) {
  return (
    <Button 
      variant="ghost" 
      className={`h-14 flex items-center justify-center gap-3 bg-white/20 dark:bg-slate-950/40 border border-white/10 hover:border-brand-primary/20 !rounded-2xl transition-all group`}
    >
       <Icon size={16} className={`text-${accent} group-hover:text-brand-primary transition-colors`} />
       <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-brand-primary transition-colors">{label}</span>
    </Button>
  );
}

function ActivityIcon({ size, className }: { size: number, className: string }) {
    return <Activity size={size} className={className} />;
}
