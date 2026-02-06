import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/auth';
import './AdminNav.css';

const AdminNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="admin-nav">
      <div className="admin-nav-container">
        <Link to="/dashboard" className="admin-nav-logo">
          <span className="admin-nav-icon">⚙️</span>
          <span>Admin Panel</span>
        </Link>
        
        <div className="admin-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/drivers">Drivers</Link>
          <Link to="/rides">Rides</Link>
          <Link to="/users">Users</Link>
          <Link to="/analytics">Analytics</Link>
          <Link to="/test">🔧 Test</Link>
        </div>

        <div className="admin-nav-user">
          <span>{user?.full_name || user?.email}</span>
          <button onClick={handleLogout} className="admin-nav-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;

