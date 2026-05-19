import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { isExpired } from '../utils/dateUtils';

interface PlanData {
  id: number;
  name: string;
  features: Record<string, boolean>;
}

interface Subscription {
  status: 'active' | 'expired' | 'pending';
  expiry_date: string | null;
  confirmed_at: string | null;
  plan: PlanData;
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

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Global Settings
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'global_free_toggle')
        .maybeSingle();
      
      setGlobalFree(settings?.value === true || settings?.value === 'true');

      // 2. Fetch Shop Subscription and Server Time
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
        const actualStatus = (subData.status === 'active' && isExpired(subData.expiry_date, serverNow)) 
          ? 'expired' 
          : subData.status;

        // Supabase returns plan as object from the join
        const planData = (Array.isArray(subData.plan) ? subData.plan[0] : subData.plan) as PlanData;
        setSubscription({
          status: actualStatus as Subscription['status'],
          expiry_date: subData.expiry_date,
          confirmed_at: null,
          plan: planData,
        });
      } else {
        // Check for pending payment
        const { data: pendingPayment } = await supabase
          .from('payments')
          .select('plan:plans(id, name, features)')
          .eq('shop_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingPayment) {
          const pendingPlan = (Array.isArray(pendingPayment.plan) ? pendingPayment.plan[0] : pendingPayment.plan) as PlanData;
          setSubscription({
            status: 'pending',
            expiry_date: null,
            confirmed_at: null,
            plan: pendingPlan,
          });
        } else if (subData) {
          const fallbackPlan = (Array.isArray(subData.plan) ? subData.plan[0] : subData.plan) as PlanData;
          setSubscription({
            status: subData.status as Subscription['status'],
            expiry_date: subData.expiry_date,
            confirmed_at: null,
            plan: fallbackPlan,
          });
        } else {
          setSubscription(null);
        }
      }
    } catch (err) {
      console.error('[SubscriptionContext] Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    subscriptionRef.current = subscription;
  }, [subscription]);

  useEffect(() => {
    fetchSubscription();

    if (!user) return;

    const channel = supabase.channel(`sub-sync-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'subscriptions',
        filter: `shop_id=eq.${user.id}`
      }, () => fetchSubscription())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'payments',
        filter: `shop_id=eq.${user.id}`
      }, () => fetchSubscription())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSubscription]);

  const hasFeature = useCallback((featureId: string) => {
    if (isAdmin || globalFree) return true;
    if (!subscription || subscription.status !== 'active') return false;
    if (isExpired(subscription.expiry_date)) return false;
    return subscription.plan.features[featureId] === true;
  }, [isAdmin, globalFree, subscription]);

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
