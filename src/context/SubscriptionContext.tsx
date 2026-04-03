import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Subscription {
  status: 'active' | 'expired' | 'pending';
  expiry_date: string | null;
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

  const fetchSubscription = async () => {
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
        .single();
      
      setGlobalFree(settings?.value === true || settings?.value === 'true');

      // 2. Fetch Shop Subscription
      const { data: subData, error } = await supabase
        .from('subscriptions')
        .select(`
          status,
          expiry_date,
          plan:plans (
            id,
            name,
            features
          )
        `)
        .eq('shop_id', user.id)
        .single();

      if (subData) {
        setSubscription(subData as any);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const hasFeature = (featureId: string) => {
    // Admin always has all features
    if (isAdmin) return true;
    
    // Global Free Toggle
    if (globalFree) return true;

    // Check Subscription
    if (!subscription || subscription.status !== 'active') return false;

    // Check if expiry date has passed
    if (subscription.expiry_date && new Date(subscription.expiry_date) < new Date()) {
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
