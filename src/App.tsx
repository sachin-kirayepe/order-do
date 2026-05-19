import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// ─── Context Providers ──────────────────────────────────────────────────
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { VoiceProvider } from './context/VoiceContext';


// ─── Shared Components & Guards ──────────────────────────────────────────
import Loader from './components/ui/Loader';
import SecurityManager from './components/ui/SecurityManager';
import OfflineBanner from './components/ui/OfflineBanner';
import InstallPrompt from './components/ui/InstallPrompt';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';


import Login from './pages/shop/Login';
import Register from './pages/shop/Register';

// ─── Lazy Loaded Pages ──────────────────────────────────────────────────
const Landing = lazy(() => import('./pages/Landing'));
// const Login = lazy(() => import('./pages/shop/Login'));
// const Register = lazy(() => import('./pages/shop/Register'));
const Setup = lazy(() => import('./pages/shop/Setup'));
const Dashboard = lazy(() => import('./pages/shop/Dashboard'));
const KDSView = lazy(() => import('./pages/shop/KDSView'));
const OrderFlow = lazy(() => import('./pages/order/OrderFlow'));

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminPlans = lazy(() => import('./pages/admin/Plans'));
const Plans = lazy(() => import('./pages/Plans'));
const AdminShops = lazy(() => import('./pages/admin/Shops'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminMessages = lazy(() => import('./pages/admin/Messages'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminDisputes = lazy(() => import('./pages/admin/Disputes'));

const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/legal/TermsAndConditions'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Resources = lazy(() => import('./pages/Resources'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Force content to top on navigation and clear potential rendering artifacts
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}


function GlobalUI({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollToTop />
      <SecurityManager />
      <OfflineBanner />
      <InstallPrompt />
      <div id="app-background" aria-hidden="true" />
      {children}
    </>
  );
}

function AppContent() {
  const location = useLocation();
  return (
    <GlobalUI>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <Loader />
        </div>
      }>
        <Routes key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/shop/login" element={<Login />} />
          <Route path="/shop/register" element={<Register />} />
          <Route path="/order" element={<OrderFlow />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/legal/terms" element={<TermsAndConditions />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/legal/cookies" element={<CookiePolicy />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/contact" element={<ContactUs />} />

          {/* Shopkeeper Protected Routes */}
          <Route path="/shop/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
          <Route path="/shop/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/shop/kds" element={<ProtectedRoute><KDSView /></ProtectedRoute>} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="shops" element={<AdminShops />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="disputes" element={<AdminDisputes />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </GlobalUI>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <VoiceProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <AppContent />
              </SubscriptionProvider>
            </AuthProvider>
          </VoiceProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
