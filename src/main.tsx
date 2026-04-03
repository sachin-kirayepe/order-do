import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { cleanupStaleOrders } from './utils/cleanup'

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(
      (registration) => console.log('[SW] Registered:', registration.scope),
      (err) => console.log('[SW] Registration failed:', err)
    );
  });
}

// Auto-cleanup stale orders on startup
cleanupStaleOrders();

// Also cleanup every 10 minutes while app is running
setInterval(cleanupStaleOrders, 10 * 60 * 1000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif",
          borderRadius: '14px',
        },
      }}
      richColors
      closeButton
    />
    <App />
  </StrictMode>,
)
