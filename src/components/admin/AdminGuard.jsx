import { Navigate } from 'react-router-dom';
import { isAdmin } from '../../lib/adminService';

export default function AdminGuard({ user, children }) {
  if (!user || !isAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
