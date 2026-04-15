import React, { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes session lock

export const AdminSessionGuard = ({ children }: { children: React.ReactNode }) => {
  const { logout, isAdminVerified, isAdmin } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (isAdmin && isAdminVerified) {
      timeoutRef.current = setTimeout(() => {
        // Soft lock: just reset verified state if possible, but for 'Strong' security, we force logout.
        toast.warning('SESSION_EXPIRED: Tactical timeout triggered for security.');
        logout();
      }, IDLE_TIMEOUT);
    }
  }, [isAdmin, isAdminVerified, logout]);

  useEffect(() => {
    if (!isAdmin || !isAdminVerified) return;

    // Monitor for user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Start initial timer
    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isAdmin, isAdminVerified, resetTimer]);

  return <>{children}</>;
};

export default AdminSessionGuard;
