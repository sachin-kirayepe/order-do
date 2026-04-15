import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { isExpired } from '../utils/dateUtils';

interface Subscription {
  status: 'active' | 'expired' | 'pending';
  expiry_date: string | null;
  confirmed_at: string | null;
  plan: {
    id: number;
    name: string;
    features: Record<string, boolean>;
  };
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  globalFree: boolean;
  hasFeature: (featureId: string) => boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: true,
  globalFree: false,
  hasFeature: () => false,
  refreshSubscription: async () => {},
});

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalFree, setGlobalFree] = useState(false);
  const subscriptionRef = useRef<Subscription | null>(null);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Validate UUID format to prevent database crash
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user.id)) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      // 2. Fetch Global Settings
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'global_free_toggle')
        .maybeSingle();
      
      setGlobalFree(settings?.value === true || settings?.value === 'true');

      // 3. Fetch Shop Subscription and Server Time
      const [subResult, timeResult] = await Promise.all([
        supabase
          .from('subscriptions')
          .select(`
            status,
            expiry_date,
            plan:plans ( id, name, features )
          `)
          .eq('shop_id', user.id)
          .maybeSingle(),
        supabase.rpc('get_server_time')
      ]);

      const subData = subResult.data;
      const serverNow = timeResult.data ? new Date(timeResult.data) : new Date();

      if (subData && (subData.status === 'active' || subData.status === 'expired')) {
        // Double check status based on server time
        const actualStatus = (subData.status === 'active' && isExpired(subData.expiry_date, serverNow)) 
          ? 'expired' 
          : subData.status;

        setSubscription({ ...subData, status: actualStatus } as any);
      } else {
        // Check for a pending payment request to show "Selected Plan"
        const { data: pendingPayment } = await supabase
          .from('payments')
          .select('plan:plans(id, name, features)')
          .eq('shop_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingPayment) {
          setSubscription({
            status: 'pending',
            expiry_date: null,
            confirmed_at: null,
            plan: pendingPayment.plan as any
          });
        } else {
          setSubscription(subData as any || null);
        }
      }

      // 4. Fetch Activation Timestamp for active subscriptions from payment_history
      if (subData && subData.status === 'active') {
        const { data: activatedRecord } = await supabase
          .from('payment_history')
          .select('confirmed_at')
          .eq('shop_id', user.id)
          .eq('status', 'confirmed')
          .order('confirmed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activatedRecord) {
          setSubscription(prev => prev ? { ...prev, confirmed_at: activatedRecord.confirmed_at } : null);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  // TC-015: Keep ref in sync with state for heartbeat access
  useEffect(() => {
    subscriptionRef.current = subscription;
  }, [subscription]);

  useEffect(() => {
    fetchSubscription();

    if (!user) return;

    // TC-015 FIX: Heartbeat uses ref to avoid stale closure
    // Always re-fetch from server to get fresh expiry state
    const heartbeat = setInterval(() => {
      const current = subscriptionRef.current;
      if (current?.expiry_date && isExpired(current.expiry_date)) {
        console.log('[SubscriptionContext] Heartbeat detected expiration');
        fetchSubscription(); // Refresh state to lock UI
      }
    }, 60000);

    // Listen for realtime updates to this shop's subscription or payments
    const channel = supabase.channel(`shop-sub-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'subscriptions',
        filter: `shop_id=eq.${user.id}`
      }, () => {
        console.log('[SubscriptionContext] Realtime Update detected (subscriptions)');
        fetchSubscription();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'payment_history',
        filter: `shop_id=eq.${user.id}`
      }, () => {
        console.log('[SubscriptionContext] Realtime Update detected (payment_history)');
        fetchSubscription();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'payments',
        filter: `shop_id=eq.${user.id}`
      }, () => {
        console.log('[SubscriptionContext] Realtime Update detected (payments pool)');
        fetchSubscription();
      })
      .subscribe();

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const hasFeature = (featureId: string) => {
    // Admin always has all features
    if (isAdmin) return true;
    
    // Global Free Toggle
    if (globalFree) return true;

    // Check Subscription
    if (!subscription || subscription.status !== 'active') return false;

    // Check if expiry date has passed
    if (isExpired(subscription.expiry_date)) {
      return false;
    }

    // Check plan features
    return subscription.plan.features[featureId] === true;
  };

  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      loading, 
      globalFree,
      hasFeature, 
      refreshSubscription: fetchSubscription 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
