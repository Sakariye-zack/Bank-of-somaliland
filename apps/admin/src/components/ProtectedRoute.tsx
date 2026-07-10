import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Access denied</h2>
        <p>Your role ({user.role.replace(/_/g, ' ')}) does not have access to this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}
