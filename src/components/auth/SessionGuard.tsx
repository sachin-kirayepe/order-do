import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { getDeviceId, getDeviceName } from '../../utils/deviceInfo';
import { supabase } from '../../lib/supabase';
import Loader from '../ui/Loader';
import DeviceLimit from '../../pages/shop/DeviceLimit';

interface SessionGuardProps {
  children: React.ReactNode;
}

export default function SessionGuard({ children }: SessionGuardProps) {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const deviceId = getDeviceId();
  const deviceName = getDeviceName();

  useEffect(() => {
    const checkSession = async () => {
      if (authLoading || subLoading) return;

      if (!user) {
        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      // Admin or specific roles might bypass this if needed
      // but usually even admin wants to see their devices
      if (isAdmin) {
         setIsAuthorized(true);
         setLoading(false);
         return;
      }

      try {
        // 1. Get Plan Limit
        // features.max_devices might be null, number, or undefined
        const planLimit = (subscription?.plan?.features as any)?.max_devices ?? 1;
        
        // 2. Refresh current device record (heartbeat)
        const { data: currentSession } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('device_id', deviceId)
          .maybeSingle();

        if (currentSession) {
          // Update last active
          await supabase
            .from('user_sessions')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', currentSession.id);
          
          setIsAuthorized(true);
        } else {
          // 3. Check total session count
          const { count, error: countError } = await supabase
            .from('user_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (countError) throw countError;

          if (count !== null && count < (planLimit === -1 ? Infinity : planLimit)) {
            // Register this device
            const { error: regError } = await supabase
              .from('user_sessions')
              .insert([{
                user_id: user.id,
                device_id: deviceId,
                device_name: deviceName
              }]);
            
            if (regError) throw regError;
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        }
      } catch (err) {
        console.error('[SessionGuard] Error:', err);
        // TC-012 FIX: Fail-CLOSED — deny access on DB errors instead of granting it
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, subLoading, subscription, isAdmin]);

  if (loading || authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader />
      </div>
    );
  }

  if (isAuthorized === false) {
    return <DeviceLimit />;
  }

  return <>{children}</>;
}
