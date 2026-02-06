import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AdminRoute from "./components/AdminRoute";
import AdminNav from "./components/AdminNav";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DriverManagement from "./pages/DriverManagement";
import RideManagement from "./pages/RideManagement";
import UserManagement from "./pages/UserManagement";
import Analytics from "./pages/Analytics";
import DatabaseTest from "./pages/DatabaseTest";
import "./App.css";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <AdminRoute>
                <AdminNav />
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/drivers" element={<DriverManagement />} />
                  <Route path="/rides" element={<RideManagement />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/test" element={<DatabaseTest />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<div className="admin-404"><h2>404 - Page Not Found</h2></div>} />
                </Routes>
              </AdminRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

