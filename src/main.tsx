import { StrictMode } from 'react'; // Cache Busting: 2026-04-13
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { cleanupStaleOrders } from './utils/cleanup'

// SYSTEM STABILIZED: Cache management handled via PWA versioning, not brutal purges.

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
