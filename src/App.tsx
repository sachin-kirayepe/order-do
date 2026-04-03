import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Landing from './pages/Landing';
import Login from './pages/shop/Login';
import Register from './pages/shop/Register';
import Setup from './pages/shop/Setup';
import Dashboard from './pages/shop/Dashboard';
import KDSView from './pages/shop/KDSView';
import OrderFlow from './pages/order/OrderFlow';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { TalkingCharacterProvider } from './context/TalkingCharacterContext';
import TalkingCharacter from './components/ui/TalkingCharacter';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminPlans from './pages/admin/Plans';
import AdminShops from './pages/admin/Shops';
import AdminPayments from './pages/admin/Payments';
import AdminSettings from './pages/admin/Settings';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import Loader from './components/ui/Loader';
import InstallPrompt from './components/ui/InstallPrompt';
import OfflineBanner from './components/ui/OfflineBanner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader /></div>;
  if (!user) return <Navigate to="/shop/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <TalkingCharacterProvider>
              <BrowserRouter>
                {/* Global overlays */}
                <OfflineBanner />
                <InstallPrompt />
                <TalkingCharacter />

                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/shop/login" element={<Login />} />
                  <Route path="/shop/register" element={<Register />} />

                  {/* Protected Shopkeeper */}
                  <Route path="/shop/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
                  <Route path="/shop/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/shop/kds" element={<ProtectedRoute><KDSView /></ProtectedRoute>} />

                  {/* Admin Panel */}
                  <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="plans" element={<AdminPlans />} />
                    <Route path="shops" element={<AdminShops />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                  {/* Public Customer Order Flow */}
                  <Route path="/order" element={<OrderFlow />} />

                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </BrowserRouter>
            </TalkingCharacterProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
