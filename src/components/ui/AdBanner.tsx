import { useEffect, useState } from 'react';
import { AD_CONFIG } from '../../utils/adConfig';
import { ExternalLink, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdBannerProps {
  slot: keyof typeof AD_CONFIG.slots;
  className?: string;
  isPremium?: boolean;
}

export default function AdBanner({ slot, className = '', isPremium = false }: AdBannerProps) {
  const [showAds, setShowAds] = useState<boolean | null>(null);

  // Fetch global ad config
  useEffect(() => {
    const fetchGlobalAdSetting = async () => {
      try {
        const { data } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'show_ads')
          .single();

        if (data && (data.value === false || data.value === 'false')) {
          setShowAds(false);
        } else {
          setShowAds(true); 
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // Fallback to local config if offline or table doesn't exist
        setShowAds(AD_CONFIG.enabled);
      }
    };

    fetchGlobalAdSetting();
  }, []);

  // Effect to load AdSense script if needed
  useEffect(() => {
    if (showAds === true && !import.meta.env.DEV) {
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [slot, showAds]);

  if (showAds === null) {
      return (
         <div className={`my-4 animate-pulse bg-slate-100 dark:bg-slate-800 h-[100px] rounded-2xl ${className}`} />
      );
  }

  // Don't show if globally disabled or if user is premium and config says hide
  if (!showAds || (isPremium && !AD_CONFIG.showToPremiumUsers)) {
    return null;
  }

  return (
    <div className={`ad-container my-4 flex flex-col items-center justify-center transition-all ${className}`}>
      <div className="w-full overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        {import.meta.env.DEV ? (
          /* Development Placeholder / Custom Sponsorship */
          <div className="relative group">
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10 z-10">
               <Info size={10} className="text-slate-400" />
               <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">Sponsored</span>
            </div>
            
            {AD_CONFIG.sponsorship.enabled ? (
              <a 
                href={AD_CONFIG.sponsorship.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-white">
                  <img src={AD_CONFIG.sponsorship.image} alt="Pro" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-kirana-green uppercase tracking-widest mb-1">Order-Do // Boost</p>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{AD_CONFIG.sponsorship.text}</h4>
                </div>
                <ExternalLink size={16} className="text-slate-400 group-hover:text-kirana-green transition-colors" />
              </a>
            ) : (
               <div className="h-[100px] flex items-center justify-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.3em] text-xs">
                  Ad Slot // {slot}
               </div>
            )}
          </div>
        ) : (
          /* Production AdSense Tag */
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-0000000000000000" // Placeholder Client ID
            data-ad-slot={AD_CONFIG.slots[slot]}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}
      </div>
      <p className="mt-2 text-[10px] text-slate-400 font-medium italic text-center">
         Ads help us keep Order-Do free for everyone
      </p>
    </div>
  );
}
