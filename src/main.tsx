import { StrictMode } from 'react'; // Cache Busting: 2026-04-13
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { cleanupStaleOrders } from './utils/cleanup'

// BRUTAL CACHE PURGE & SW UNREGISTER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(const registration of registrations) {
      registration.unregister();
      console.log('[SW] FORCED UNREGISTER:', registration.scope);
    }
  });
}

// Ensure the browser fetches fresh files
if (!sessionStorage.getItem('cache_purged_v2')) {
  sessionStorage.setItem('cache_purged_v2', 'true');
  localStorage.clear();
  caches.keys().then((names) => {
    names.forEach(name => caches.delete(name));
  });
  console.log('[SYSTEM] Cache purged, reloading...');
  setTimeout(() => window.location.reload(), 500);
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
