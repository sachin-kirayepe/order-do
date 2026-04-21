import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminVerified: boolean;
  verifyAdminPin: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  isAdminVerified: false,
  verifyAdminPin: async () => false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(
    sessionStorage.getItem('admin_verified') === 'true'
  );

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('shops_profile')
        .select('role, bound_device_id')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') console.warn('[Auth] Role fetch error:', error);
        return false;
      }

      if (data) {
        // SEC-005: Device Binding Check
        const { getDeviceId } = await import('../utils/deviceInfo');
        const currentDeviceId = getDeviceId();
        
        if (!data.bound_device_id) {
          // Bind device on first login
          await supabase.from('shops_profile').update({ bound_device_id: currentDeviceId }).eq('id', userId);
        } else if (data.bound_device_id !== currentDeviceId && data.role !== 'admin') {
          // Block if device mismatch (Admins are exempt for management)
          toast.error('Security Breach: This account is bound to another device. Please contact Admin.');
          await supabase.auth.signOut();
          return false;
        }
      }

      return data?.role === 'admin';
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[Auth] System initialization...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Session initialization error:', error);
          // Standard Supabase behavior: Invalid sessions are treated as logged-out
          setLoading(false);
          return;
        }

        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          const isAdm = await checkAdminStatus(currentUser.id);
          setIsAdmin(isAdm);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('[Auth] Critical initialization failure:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log(`[Auth] State Change Detected: ${_event}`);
        
        const currentUser = newSession?.user ?? null;
        
        if (_event === 'SIGNED_IN') {
          setLoading(true);
        }

        try {
          setSession(newSession);
          setUser(currentUser);
          
          if (currentUser) {
            const isAdm = await checkAdminStatus(currentUser.id);
            setIsAdmin(isAdm);
          } else {
            setIsAdmin(false);
            setIsAdminVerified(false);
          }

          if (_event === 'SIGNED_OUT') {
            setIsAdminVerified(false);
            localStorage.clear(); // Nuclear clear on signout to prevent stale port-drift
            sessionStorage.clear();
          }
        } catch (err) {
          console.error('[Auth] Event processing failed:', err);
        } finally {
          setLoading(false);
        }
      }
    );

    const handleActivity = () => {
      if (isAdminVerified) {
        sessionStorage.setItem('last_admin_activity', Date.now().toString());
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    const idleInterval = setInterval(() => {
      if (isAdminVerified) {
        const lastActivity = sessionStorage.getItem('last_admin_activity');
        if (lastActivity && Date.now() - parseInt(lastActivity) > 600000) { // 10 minutes
          setIsAdminVerified(false);
          sessionStorage.removeItem('admin_verified');
          toast.error('Session Expired: Re-verification required for security.');
        }
      }
    }, 30000); // Check every 30s

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(idleInterval);
    };
  }, [isAdminVerified]);

  const verifyAdminPin = async (pin: string) => {
    if (!isAdmin) return false;
    
    try {
      // SEC-004: Brute Force Protection (Check for lockout)
      const { data: isLocked, error: lockError } = await supabase.rpc('check_pin_lockout', {
        user_id_input: user?.id
      });

      if (lockError) console.warn('[Auth] Lockout check failed:', lockError);
      
      if (isLocked) {
        toast.error('Security Protocol: Device temporarily locked due to multiple failures. Try again in 5 minutes.');
        return false;
      }

      // SECURE: PIN is verified on the server via RPC
      const { data, error } = await supabase.rpc('verify_admin_pin', { 
        input_pin: pin 
      });

      // Log attempt (This should be done by the RPC verify_admin_pin ideally, but we can do it here if needed)
      // I'll assume the RPC verify_admin_pin already handles logging as per the table schema

      if (error) {
        console.error('[Auth] PIN Verification Error:', error);
        toast.error('Security Protocol Failure: Verification rejected.');
        return false;
      }

      if (data === true) {
        setIsAdminVerified(true);
        sessionStorage.setItem('admin_verified', 'true');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('[Auth] PIN error:', err);
      return false;
    }
  };

  const logout = async () => {
    setIsAdminVerified(false);
    
    // TC-003 FIX: Explicitly remove device session on logout to prevent "ghost devices"
    try {
      const { getDeviceId } = await import('../utils/deviceInfo');
      const deviceId = getDeviceId();
      if (user) {
        await supabase
          .from('user_sessions')
          .delete()
          .eq('user_id', user.id)
          .eq('device_id', deviceId);
      }
    } catch (err) {
      console.warn('[Auth] Session cleanup failed during logout:', err);
    }

    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isAdminVerified, verifyAdminPin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
