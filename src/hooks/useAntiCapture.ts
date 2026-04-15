import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useAntiCapture Hook (TC-019 FIX)
 * 
 * SECURITY FIX: Removed hostile blur/focus detection that was blocking
 * shopkeepers for normal phone usage (switching tabs, answering calls).
 * 
 * Now only detects:
 * - Specific keyboard shortcuts (PrintScreen, Cmd+Shift+4/5)
 * - Context menu attempts (right-click on sensitive data)
 * 
 * Does NOT trigger on:
 * - Tab switching
 * - Window blur/focus
 * - App switching on mobile
 * - Phone calls or notifications
 */
export function useAntiCapture(enabled: boolean = true) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [strikeCount, setStrikeCount] = useState(0);
  const [isPenaltyActive, setIsPenaltyActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleBlock = useCallback(() => {
    if (!enabled || isPenaltyActive) return;
    
    // Clear any existing timeout to prevent overlapping reset calls
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setIsBlocked(true);
    
    setStrikeCount(prev => {
      const nextCount = prev + 1;
      console.warn(`[SECURITY] Capture attempt ${nextCount} detected.`);

      if (nextCount >= 5) {
        setIsPenaltyActive(true);
        timeoutRef.current = setTimeout(() => {
          setIsPenaltyActive(false);
          setStrikeCount(0);
          setIsBlocked(false);
          timeoutRef.current = null;
        }, 2 * 60 * 1000);
      } else {
        timeoutRef.current = setTimeout(() => {
          setIsBlocked(false);
          timeoutRef.current = null;
        }, 3000);
      }
      return nextCount;
    });
  }, [enabled, isPenaltyActive]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // TC-019 FIX: REMOVED blur, visibilitychange, pagehide, beforeunload handlers
    // These were triggering on normal phone usage (calls, notifications, tab switches)
    // Only keep meaningful screenshot detection

    // 1. CONTEXT MENU (Prevent Inspect / Save Image on sensitive data)
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      // Don't count as a strike — just prevent the menu
    };

    // 2. SCREEN CAPTURE SHORTCUTS (Real screenshot attempts)
    const onKeyDown = (e: KeyboardEvent) => {
      const isScreenshotKey = 
        e.key === 'PrintScreen' || 
        (e.metaKey && e.shiftKey && (e.key === 's' || e.key === '4' || e.key === '5')) ||
        (e.ctrlKey && e.key === 'p') ||
        (e.metaKey && e.key === 'p');

      if (isScreenshotKey) {
        e.preventDefault();
        handleBlock();
      }
    };

    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown);

    // Global CSS protection injection
    document.body.classList.add('secure-context');

    return () => {
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('secure-context');
    };
  }, [enabled, handleBlock]);

  return { isBlocked, setIsBlocked, strikeCount, isPenaltyActive };
}
