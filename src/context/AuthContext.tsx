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
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('shops_profile')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') console.warn('[Auth] Role fetch error:', error);
        return false;
      }
      return data?.role === 'admin';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    return () => subscription.unsubscribe();
  }, []);

  const verifyAdminPin = async (pin: string) => {
    if (!isAdmin) return false;
    
    try {
      // SECURE: PIN is verified on the server via RPC
      // The client never sees the hash or the comparison logic.
      const { data, error } = await supabase.rpc('verify_admin_pin', { 
        input_pin: pin 
      });

      if (error) {
        console.error('[Auth] PIN Verification Error:', error);
        toast.error('Security Protocol Failure: Verification rejected.');
        return false;
      }

      if (data === true) {
        setIsAdminVerified(true);
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
