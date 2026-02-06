import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import "./Analytics.css";

const Analytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, all

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAnalytics();
    }
  }, [user, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      console.log('Loading analytics...');

      // Calculate date filter
      let dateFilter = null;
      if (dateRange === '7d') {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (dateRange === '30d') {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 30);
      }

      // Get total counts
      const [driversResult, ridesResult, usersResult, revenueResult] = await Promise.all([
        supabase.from('driver_profiles').select('*', { count: 'exact', head: true }),
        dateFilter 
          ? supabase.from('rides').select('*', { count: 'exact', head: true }).gte('requested_at', dateFilter.toISOString())
          : supabase.from('rides').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        dateFilter
          ? supabase.from('rides').select('fare_final').gte('requested_at', dateFilter.toISOString()).not('fare_final', 'is', null)
          : supabase.from('rides').select('fare_final').not('fare_final', 'is', null)
      ]);

      // Calculate revenue
      let totalRevenue = 0;
      if (revenueResult.data) {
        totalRevenue = revenueResult.data.reduce((sum, ride) => sum + (ride.fare_final || 0), 0);
      }

      // Get ride status breakdown
      const { data: ridesByStatus } = await supabase
        .from('rides')
        .select('status')
        .limit(1000);

      const statusCounts = {};
      if (ridesByStatus) {
        ridesByStatus.forEach(ride => {
          statusCounts[ride.status] = (statusCounts[ride.status] || 0) + 1;
        });
      }

      // Get active drivers
      const { data: activeDrivers } = await supabase
        .from('driver_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_available', true);

      setStats({
        totalDrivers: driversResult.count || 0,
        totalRides: ridesResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalRevenue: totalRevenue,
        activeDrivers: activeDrivers?.length || 0,
        ridesByStatus: statusCounts
      });

      console.log('Analytics loaded:', stats);
    } catch (error) {
      console.error("Error loading analytics:", error);
      alert(`Failed to load analytics: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
    <div className="admin-analytics">
      <div className="admin-page-header">
        <h2>Analytics Dashboard</h2>
        <div className="admin-page-actions">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button onClick={loadAnalytics} className="btn-refresh" disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="admin-loading">Loading analytics...</div>
      ) : stats ? (
        <>
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">👥</div>
              <div className="metric-content">
                <div className="metric-value">{stats.totalUsers}</div>
                <div className="metric-label">Total Users</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🚗</div>
              <div className="metric-content">
                <div className="metric-value">{stats.totalDrivers}</div>
                <div className="metric-label">Total Drivers</div>
                <div className="metric-subtext">{stats.activeDrivers} active</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">📋</div>
              <div className="metric-content">
                <div className="metric-value">{stats.totalRides}</div>
                <div className="metric-label">Total Rides</div>
              </div>
            </div>

            <div className="metric-card revenue">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <div className="metric-value">{formatCurrency(stats.totalRevenue)}</div>
                <div className="metric-label">Total Revenue</div>
              </div>
            </div>
          </div>

          {/* Ride Status Breakdown */}
          <div className="status-breakdown">
            <h3>Ride Status Breakdown</h3>
            <div className="status-grid">
              {Object.entries(stats.ridesByStatus).map(([status, count]) => (
                <div key={status} className="status-item">
                  <span className="status-name">{status}</span>
                  <span className="status-count">{count}</span>
                </div>
              ))}
              {Object.keys(stats.ridesByStatus).length === 0 && (
                <p className="no-data">No ride data available</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="admin-empty-state">No analytics data available.</div>
      )}
    </div>
  );
};

export default Analytics;

