import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-user-info">
          <span>Welcome, {user?.full_name || user?.email}</span>
        </div>
      </div>

      <div className="admin-nav-grid">
        <Link to="/drivers" className="admin-nav-card">
          <div className="admin-nav-icon">🚗</div>
          <h3>Driver Management</h3>
          <p>Approve, reject, and manage drivers</p>
        </Link>

        <Link to="/rides" className="admin-nav-card">
          <div className="admin-nav-icon">📋</div>
          <h3>Ride Management</h3>
          <p>Assign drivers, track rides, update status</p>
        </Link>

        <Link to="/users" className="admin-nav-card">
          <div className="admin-nav-icon">👥</div>
          <h3>User Management</h3>
          <p>View and manage all users, change roles</p>
        </Link>

        <Link to="/analytics" className="admin-nav-card">
          <div className="admin-nav-icon">📊</div>
          <h3>Analytics</h3>
          <p>View statistics, revenue, and metrics</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

