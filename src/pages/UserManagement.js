import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import "./UserManagement.css";

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading users...');
      
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterRole !== 'all') {
        query = query.eq('role', filterRole);
      }

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Users fetch error:', error);
        throw error;
      }

      console.log('Users loaded:', data?.length || 0);
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details
      });
      alert(`Failed to load users: ${error.message || 'Unknown error'}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filterRole, searchTerm]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadUsers();
    }
  }, [user, loadUsers]);

  useEffect(() => {
    if (user && user.role === 'admin' && searchTerm) {
      const timeoutId = setTimeout(() => {
        loadUsers();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, user, loadUsers]);


  const handleUpdateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      alert("User role updated successfully!");
      loadUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You must be an administrator to access this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-user-management">
      <div className="admin-page-header">
        <h2>User Management</h2>
        <div className="admin-page-actions">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="role-filter"
          >
            <option value="all">All Roles</option>
            <option value="rider">Riders</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
          </select>
          <button onClick={loadUsers} className="btn-refresh" disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="admin-loading">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="admin-empty-state">No users found.</div>
      ) : (
        <>
          <div className="users-stats">
            <div className="stat-card">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.filter(u => u.role === 'rider').length}</div>
              <div className="stat-label">Riders</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.filter(u => u.role === 'driver').length}</div>
              <div className="stat-label">Drivers</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.filter(u => u.role === 'admin').length}</div>
              <div className="stat-label">Admins</div>
            </div>
          </div>

          <div className="users-list">
            {users.map((userProfile) => (
              <div key={userProfile.id} className="user-card">
                <div className="user-card-header">
                  <div>
                    <h4>{userProfile.full_name || 'No Name'}</h4>
                    <span className="user-email">{userProfile.email || 'N/A'}</span>
                  </div>
                  <span className={`role-badge role-${userProfile.role}`}>
                    {userProfile.role || 'rider'}
                  </span>
                </div>

                <div className="user-card-body">
                  <div className="user-details">
                    <p><strong>User ID:</strong> {userProfile.id.substring(0, 8)}...</p>
                    <p><strong>Phone:</strong> {userProfile.phone || 'N/A'}</p>
                    <p><strong>Created:</strong> {formatDate(userProfile.created_at)}</p>
                  </div>

                  <div className="user-actions">
                    <label>Change Role:</label>
                    <select
                      value={userProfile.role || 'rider'}
                      onChange={(e) => handleUpdateUserRole(userProfile.id, e.target.value)}
                      className="role-select"
                    >
                      <option value="rider">Rider</option>
                      <option value="driver">Driver</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;

