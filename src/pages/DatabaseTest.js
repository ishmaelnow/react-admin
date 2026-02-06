import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import "./DatabaseTest.css";

const DatabaseTest = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, data = null, error = null) => {
    setTestResults(prev => [...prev, { test, status, data, error, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setTestResults([]);
    setLoading(true);

    // Test 1: Check Supabase connection
    addResult("Supabase Connection", "testing");
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      addResult("Supabase Connection", "success", { hasSession: !!session, userId: session?.user?.id });
    } catch (error) {
      addResult("Supabase Connection", "error", null, error.message);
    }

    // Test 2: Check user profile
    addResult("User Profile", "testing");
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      addResult("User Profile", "success", { role: data?.role, name: data?.full_name });
    } catch (error) {
      addResult("User Profile", "error", null, error.message);
    }

    // Test 3: Check driver_profiles table access
    addResult("Driver Profiles Table", "testing");
    try {
      const { data, error, count } = await supabase
        .from('driver_profiles')
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) throw error;
      addResult("Driver Profiles Table", "success", { 
        count: count || data?.length || 0, 
        sample: data?.slice(0, 2) 
      });
    } catch (error) {
      addResult("Driver Profiles Table", "error", null, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }

    // Test 4: Check rides table access
    addResult("Rides Table", "testing");
    try {
      const { data, error, count } = await supabase
        .from('rides')
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) throw error;
      addResult("Rides Table", "success", { 
        count: count || data?.length || 0,
        sample: data?.slice(0, 2)
      });
    } catch (error) {
      addResult("Rides Table", "error", null, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }

    // Test 5: Check profiles table access
    addResult("Profiles Table", "testing");
    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) throw error;
      addResult("Profiles Table", "success", { 
        count: count || data?.length || 0,
        sample: data?.slice(0, 2)
      });
    } catch (error) {
      addResult("Profiles Table", "error", null, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      runTests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="database-test">
      <div className="test-header">
        <h2>Database Connection Test</h2>
        <button onClick={runTests} disabled={loading} className="btn-test">
          {loading ? "Testing..." : "Run Tests Again"}
        </button>
      </div>

      <div className="test-info">
        <p><strong>Current User:</strong> {user?.email || 'Not logged in'}</p>
        <p><strong>User Role:</strong> {user?.role || 'Unknown'}</p>
        <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
      </div>

      <div className="test-results">
        <h3>Test Results:</h3>
        {testResults.length === 0 ? (
          <p>Click "Run Tests" to start</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className={`test-result test-${result.status}`}>
              <div className="test-result-header">
                <span className="test-name">{result.test}</span>
                <span className={`test-status status-${result.status}`}>
                  {result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏳'}
                </span>
              </div>
              {result.data && (
                <div className="test-data">
                  <pre>{JSON.stringify(result.data, null, 2)}</pre>
                </div>
              )}
              {result.error && (
                <div className="test-error">
                  <strong>Error:</strong>
                  <pre>{JSON.stringify(result.error, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DatabaseTest;

