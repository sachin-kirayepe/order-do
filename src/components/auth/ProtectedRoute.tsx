import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../ui/Loader';
import SessionGuard from './SessionGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/shop/login" />;
  }

  return (
    <SessionGuard>
      {children}
    </SessionGuard>
  );
};

export default ProtectedRoute;
