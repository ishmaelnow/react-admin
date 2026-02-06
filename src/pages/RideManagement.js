import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import "./RideManagement.css";

const RideManagement = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("matching"); // matching, accepted, in_progress, completed
  const [selectedRide, setSelectedRide] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const loadRides = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading rides with status:', filterStatus);
      
      // Get rides first
      let query = supabase
        .from('rides')
        .select('*')
        .order('requested_at', { ascending: false })
        .limit(50);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data: ridesData, error: ridesError } = await query;

      if (ridesError) {
        console.error('Rides fetch error:', ridesError);
        throw ridesError;
      }

      console.log('Rides loaded:', ridesData?.length || 0);

      // Get rider profiles
      if (ridesData && ridesData.length > 0) {
        const riderIds = ridesData.map(r => r.rider_id).filter(Boolean);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', riderIds);

        if (profileError) {
          console.warn('Profile fetch error (non-blocking):', profileError);
        }

        // Merge profile data with rides
        const ridesWithProfiles = ridesData.map(ride => ({
          ...ride,
          profiles: profileData?.find(p => p.id === ride.rider_id) || null
        }));

        console.log('Rides with profiles:', ridesWithProfiles.length);
        setRides(ridesWithProfiles);
      } else {
        setRides([]);
      }
    } catch (error) {
      console.error("Error loading rides:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      alert(`Failed to load rides: ${error.message || 'Unknown error'}`);
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadRides();
      loadAvailableDrivers();
    }
  }, [user, loadRides, loadAvailableDrivers]);


  const loadAvailableDrivers = useCallback(async () => {
    try {
      console.log('Loading available drivers...');
      
      const { data: driverData, error: driverError } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('is_available', true);

      if (driverError) {
        console.error('Available drivers error:', driverError);
        throw driverError;
      }

      console.log('Available drivers loaded:', driverData?.length || 0);

      // Get profiles for drivers
      if (driverData && driverData.length > 0) {
        const userIds = driverData.map(d => d.user_id).filter(Boolean);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profileError) {
          console.warn('Profile fetch error (non-blocking):', profileError);
        }

        const driversWithProfiles = driverData.map(driver => ({
          ...driver,
          profiles: profileData?.find(p => p.id === driver.user_id) || null
        }));

        setAvailableDrivers(driversWithProfiles);
      } else {
        setAvailableDrivers([]);
      }
    } catch (error) {
      console.error("Error loading available drivers:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details
      });
      setAvailableDrivers([]);
    }
  }, []);

  const handleAssignRide = async () => {
    if (!selectedRide || !selectedDriverId) {
      alert("Please select a driver");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('rides')
        .update({
          driver_id: selectedDriverId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', selectedRide.id);

      if (error) throw error;

      alert("Ride assigned successfully!");
      setShowAssignModal(false);
      setSelectedRide(null);
      setSelectedDriverId("");
      loadRides();
    } catch (error) {
      console.error("Error assigning ride:", error);
      alert("Failed to assign ride.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRideStatus = async (rideId, newStatus) => {
    try {
      setLoading(true);
      const updateData = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (newStatus === 'canceled') {
        updateData.canceled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('rides')
        .update(updateData)
        .eq('id', rideId);

      if (error) throw error;
      loadRides();
    } catch (error) {
      console.error("Error updating ride status:", error);
      alert("Failed to update ride status.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
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
    <div className="admin-ride-management">
      <div className="admin-page-header">
        <h2>Ride Management</h2>
        <div className="admin-page-actions">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Rides</option>
            <option value="matching">Matching</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
          <button onClick={loadRides} className="btn-refresh" disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading && rides.length === 0 ? (
        <div className="admin-loading">Loading rides...</div>
      ) : rides.length === 0 ? (
        <div className="admin-empty-state">No rides found.</div>
      ) : (
        <div className="rides-list">
          {rides.map((ride) => (
            <div key={ride.id} className="ride-card">
              <div className="ride-card-header">
                <div>
                  <h4>{ride.profiles?.full_name || 'Unknown Rider'}</h4>
                  <span className="ride-id">ID: {ride.id.substring(0, 8)}...</span>
                </div>
                <span className={`status-badge status-${ride.status}`}>
                  {ride.status}
                </span>
              </div>

              <div className="ride-card-body">
                <div className="ride-route">
                  <p><strong>From:</strong> {ride.pickup_address}</p>
                  <p><strong>To:</strong> {ride.dropoff_address}</p>
                </div>

                <div className="ride-details">
                  <p><strong>Requested:</strong> {formatDate(ride.requested_at)}</p>
                  {ride.scheduled_at && (
                    <p><strong>Scheduled:</strong> {formatDate(ride.scheduled_at)}</p>
                  )}
                  {ride.fare_estimate && (
                    <p><strong>Fare Estimate:</strong> {formatCurrency(ride.fare_estimate)}</p>
                  )}
                  {ride.fare_final && (
                    <p><strong>Final Fare:</strong> {formatCurrency(ride.fare_final)}</p>
                  )}
                </div>

                {ride.status === 'matching' && (
                  <button
                    onClick={() => {
                      setSelectedRide(ride);
                      setShowAssignModal(true);
                    }}
                    className="btn-assign"
                  >
                    Assign Driver
                  </button>
                )}

                <div className="ride-actions">
                  {ride.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateRideStatus(ride.id, 'in_progress')}
                      className="btn-status"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {ride.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateRideStatus(ride.id, 'completed')}
                      className="btn-status"
                    >
                      Mark Completed
                    </button>
                  )}
                  {(ride.status === 'matching' || ride.status === 'accepted') && (
                    <button
                      onClick={() => handleUpdateRideStatus(ride.id, 'canceled')}
                      className="btn-cancel"
                    >
                      Cancel Ride
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Driver</h3>
              <button onClick={() => setShowAssignModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <p><strong>Ride:</strong> {selectedRide?.pickup_address} → {selectedRide?.dropoff_address}</p>
              
              {availableDrivers.length === 0 ? (
                <p>No available drivers at the moment.</p>
              ) : (
                <>
                  <label>Select Driver:</label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="driver-select"
                  >
                    <option value="">Choose a driver...</option>
                    {availableDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.profiles?.full_name || 'Driver'} - {driver.vehicle_make} {driver.vehicle_model}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAssignModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button
                onClick={handleAssignRide}
                disabled={!selectedDriverId || loading}
                className="btn-primary"
              >
                {loading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideManagement;

