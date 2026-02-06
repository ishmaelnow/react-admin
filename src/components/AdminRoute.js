import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * AdminRoute - Protects routes that require admin access
 */
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You must be an administrator to access this page.</p>
        <button onClick={() => window.location.href = '/'}>Go to Public Site</button>
      </div>
    );
  }

  return children;
};

export default AdminRoute;

