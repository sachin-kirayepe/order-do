import { useState, useEffect, useCallback } from 'react';

/**
 * useAntiCapture Hook
 * Detects actions often associated with screenshots or screen recordings:
 * - App switching (visibilitychange)
 * - Window losing focus (blur)
 * - Specific keyboard shortcuts (PrintScreen, Cmd+Shift+4, etc.)
 * - Context menu attempts
 */
export function useAntiCapture(enabled: boolean = true) {
  const [isBlocked, setIsBlocked] = useState(false);

  const handleBlock = useCallback(() => {
    if (!enabled) return;
    setIsBlocked(true);
    // Automatically unblock after a few seconds to let the user continue,
    // but only if they haven't triggered it again.
    setTimeout(() => setIsBlocked(false), 3000);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleBlock();
      }
    };

    const onBlur = () => handleBlock();
    
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleBlock();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // PrintScreen (Key code 44 or 'PrintScreen')
      // Meta+Shift+S (Windows Snipping Tool)
      // Meta+Shift+4 (Mac Screenshot)
      // Ctrl+P (Print)
      const isScreenshotKey = 
        e.key === 'PrintScreen' || 
        (e.metaKey && e.shiftKey && (e.key === 's' || e.key === '4')) ||
        (e.ctrlKey && e.key === 'p');

      if (isScreenshotKey) {
        e.preventDefault();
        handleBlock();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled, handleBlock]);

  return { isBlocked, setIsBlocked };
}
