import React, { useState, useEffect } from "react";
import { signIn, signOut } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const { email, password } = formData;
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMessage = validateForm();
    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Step 1: Sign in
      await signIn(formData.email, formData.password);
      
      // Step 2: Get the authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(authError.message || "Failed to get user information.");
      }
      
      if (!authUser) {
        throw new Error("User not found after login.");
      }
      
      // Step 3: Check admin role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', authUser.id)
        .single();
      
      // Log for debugging
      console.log('Auth User ID:', authUser.id);
      console.log('Profile data:', profile);
      console.log('Profile error:', profileError);
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error(`Failed to load user profile: ${profileError.message}`);
      }
      
      if (!profile) {
        throw new Error("User profile not found. Please contact support.");
      }
      
      if (profile.role !== 'admin') {
        console.log('User role:', profile.role, 'Expected: admin');
        setError(`Access denied. Admin privileges required. Your role is: ${profile.role || 'not set'}`);
        await signOut();
        setLoading(false);
        return;
      }
      
      // Step 4: Refresh user context
      await refreshUser();
      
      // Step 5: Navigate to dashboard
      navigate("/dashboard");
      setFormData({ email: "", password: "" });
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <h2>Admin Login</h2>
        <p className="admin-login-subtitle">Administrative Dashboard Access</p>
        
        {error && <div className="admin-error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

