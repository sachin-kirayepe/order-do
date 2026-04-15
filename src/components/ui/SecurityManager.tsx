import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function SecurityManager() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  useEffect(() => {
    // 1. Android/Mobile Detection for Startup Warning
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.indexOf("android") > -1;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      setTimeout(() => {
        toast("Security Protection Active", {
          description: isAndroid 
            ? "Is app mein screenshot lena privacy ke against hai. Protection enabled."
            : "Screen protection is active for your privacy.",
          icon: <ShieldAlert size={16} className="text-brand-primary" />,
          duration: 6000,
        });
      }, 2000);
    }
  }, []);

  useEffect(() => {
    if (isAdminPath) {
      // 2. HARDENED ADMIN SECURITY: "Tactical Stealth Mode"
      
      // A. Block Right-Click
      const blockContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        toast.error("SECURITY_LOCK: Tactical access restricted.");
      };

      // B. Block DevTools Shortcuts (F12, Ctrl+Shift+I, Ctrl+U)
      const blockDevTools = (e: KeyboardEvent) => {
        if (
          e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
          (e.ctrlKey && e.key === 'u')
        ) {
          e.preventDefault();
          toast.error("PROTOCOL_VIOLATION: Neural link tampering detected.");
          return false;
        }
      };

      // C. Blur on focus loss (anti-screen capture/peek)
      const handleBlur = () => {
        document.body.style.filter = 'blur(20px) grayscale(100%)';
        document.body.style.pointerEvents = 'none';
      };
      
      const handleFocus = () => {
        document.body.style.filter = '';
        document.body.style.pointerEvents = 'all';
      };

      window.addEventListener('contextmenu', blockContextMenu);
      window.addEventListener('keydown', blockDevTools);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);

      // Initial toast for admin security
      toast.info("STEALTH_MODE_ACTIVE", {
        description: "Hardened admin security protocol is now governing this session.",
        icon: <ShieldCheck size={16} className="text-brand-primary" />
      });

      return () => {
        window.removeEventListener('contextmenu', blockContextMenu);
        window.removeEventListener('keydown', blockDevTools);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
        document.body.style.filter = '';
        document.body.style.pointerEvents = 'all';
      };
    }
  }, [isAdminPath]);

  return (
    <div 
      className={`fixed inset-0 pointer-events-none transition-all duration-700 z-[99999] border-[10px] ${isAdminPath ? 'border-brand-primary/10' : 'border-transparent'}`} 
      aria-hidden="true" 
    />
  );
}
