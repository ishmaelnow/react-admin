import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import "./DriverManagement.css";

const DriverManagement = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDrivers();
    }
  }, [user]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      console.log('Fetching drivers...');
      
      // First, try to get driver_profiles
      const { data: driverData, error: driverError } = await supabase
        .from('driver_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (driverError) {
        console.error('Driver profiles error:', driverError);
        throw driverError;
      }

      console.log('Driver profiles loaded:', driverData?.length || 0);

      // Then get user profiles for each driver using a join query
      if (driverData && driverData.length > 0) {
        // Use Supabase join to get profiles in one query
        // Note: The foreign key relationship name might be different
        const { data: driversWithProfiles, error: joinError } = await supabase
          .from('driver_profiles')
          .select(`
            *,
            profiles!driver_profiles_user_id_fkey (
              id,
              full_name,
              email,
              phone
            )
          `)
          .order('created_at', { ascending: false });

        if (joinError) {
          console.warn('Join query error, falling back to separate queries:', joinError);
          // Fallback to separate queries - ensure we get profiles
          const userIds = driverData.map(d => d.user_id).filter(Boolean);
          
          if (userIds.length > 0) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, full_name, email, phone')
              .in('id', userIds);

            if (profileError) {
              console.error('Profile fetch error:', profileError);
            }

            // Merge profile data with driver data
            const mergedDrivers = driverData.map(driver => {
              const profile = profileData?.find(p => p.id === driver.user_id);
              return {
                ...driver,
                profiles: profile || {
                  id: driver.user_id,
                  full_name: null,
                  email: null,
                  phone: null
                }
              };
            });

            console.log('Drivers with profiles (fallback):', mergedDrivers.length);
            console.log('Sample driver:', mergedDrivers[0]);
            setDrivers(mergedDrivers);
          } else {
            // No user IDs found, just set drivers without profiles
            setDrivers(driverData.map(d => ({ ...d, profiles: null })));
          }
        } else {
          console.log('Drivers with profiles (join):', driversWithProfiles?.length || 0);
          console.log('Sample driver from join:', driversWithProfiles?.[0]);
          setDrivers(driversWithProfiles || []);
        }
      } else {
        setDrivers([]);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      alert(`Failed to load drivers: ${error.message || 'Unknown error'}`);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDriver = async (driverId) => {
    if (!window.confirm("Approve this driver?")) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('driver_profiles')
        .update({ is_active: true })
        .eq('user_id', driverId);

      if (error) throw error;
      alert("Driver approved successfully!");
      fetchDrivers();
    } catch (error) {
      console.error("Error approving driver:", error);
      alert("Failed to approve driver.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (driverId, currentStatus) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('driver_profiles')
        .update({ is_available: !currentStatus })
        .eq('user_id', driverId);

      if (error) throw error;
      fetchDrivers();
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDriver = async (driverId) => {
    if (!window.confirm("Are you sure you want to remove this driver?")) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('driver_profiles')
        .delete()
        .eq('user_id', driverId);

      if (error) throw error;
      alert("Driver removed successfully!");
      fetchDrivers();
    } catch (error) {
      console.error("Error removing driver:", error);
      alert("Failed to remove driver.");
    } finally {
      setLoading(false);
    }
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
    <div className="admin-driver-management">
      <div className="admin-page-header">
        <h2>Driver Management</h2>
        <button onClick={fetchDrivers} className="btn-refresh" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {loading && drivers.length === 0 ? (
        <div className="admin-loading">Loading drivers...</div>
      ) : drivers.length === 0 ? (
        <div className="admin-empty-state">No drivers found.</div>
      ) : (
        <div className="drivers-list">
          {drivers.map((driver) => (
            <div key={driver.user_id} className="driver-card">
              <div className="driver-card-header">
                <h4>
                  {driver.profiles?.full_name || 
                   driver.profiles?.email?.split('@')[0] || 
                   'Driver'}
                </h4>
                <span className="driver-email">{driver.profiles?.email || 'N/A'}</span>
              </div>
              
              <div className="driver-card-body">
                <div className="vehicle-info-section">
                  <p className="vehicle-info">
                    <strong>Vehicle:</strong> {driver.vehicle_year} {driver.vehicle_make} {driver.vehicle_model}
                  </p>
                  <p className="vehicle-details">
                    <strong>Color:</strong> {driver.vehicle_color} | <strong>Plate:</strong> {driver.vehicle_plate}
                  </p>
                  <p className="vehicle-details">
                    <strong>License:</strong> {driver.license_number}
                  </p>
                </div>

                <div className="driver-status-section">
                  <p className="driver-status">
                    <strong>Status:</strong> {driver.is_active ? (
                      <span className={driver.is_available ? "status-available" : "status-busy"}>
                        {driver.is_available ? "✅ Available" : "⏸️ Busy"}
                      </span>
                    ) : (
                      <span className="status-pending">⏳ Pending Approval</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="driver-actions">
                {!driver.is_active ? (
                  <>
                    <button 
                      onClick={() => handleApproveDriver(driver.user_id)}
                      className="btn-approve"
                    >
                      ✅ Approve
                    </button>
                    <button 
                      onClick={() => handleRemoveDriver(driver.user_id)}
                      className="btn-reject"
                    >
                      ❌ Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleToggleAvailability(driver.user_id, driver.is_available)}
                      className="btn-toggle"
                    >
                      {driver.is_available ? "⏸️ Mark as Busy" : "▶️ Mark as Available"}
                    </button>
                    <button 
                      onClick={() => handleRemoveDriver(driver.user_id)}
                      className="btn-remove"
                    >
                      🗑️ Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverManagement;

