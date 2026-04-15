import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../ui/Loader';
import { AdminPinGate } from './AdminPinGate';
import { AdminSessionGuard } from './AdminSessionGuard';

export const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
        <Loader />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" />;
  }

  // Hardened Security: Even if isAdmin is flagged in context (which is client-state based on email),
  // we gate the entire layout behind the volatile PIN gate and session activity monitor.
  return (
    <AdminPinGate>
      <AdminSessionGuard>
        {children}
      </AdminSessionGuard>
    </AdminPinGate>
  );
};

export default AdminProtectedRoute;
