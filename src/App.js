import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import Performance from './pages/Performance';
import Settings from './pages/Settings';
import ApplicationForm from './pages/ApplicationForm.js'
import Submissions from './pages/Submissions';
import Regions from './pages/Regions';
import { isTokenExpired, verifyToken } from './utils/authUtils';
import { initSocket, disconnectSocket } from './utils/socket';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Protected route component
const ProtectedRoute = ({ element, allowedRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      
      console.log('ProtectedRoute - Token:', token ? 'exists' : 'missing');
      
      if (!token) {
        console.log('ProtectedRoute - No token found');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log('ProtectedRoute - Token is expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Verify token with server
      const isValid = await verifyToken();
      if (!isValid) {
        console.log('ProtectedRoute - Token verification failed');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // If we have a valid token and user data, set authenticated
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          console.log('ProtectedRoute - Parsed user:', user);
          
          setIsAuthenticated(true);
          
          // Check for primaryRole first, then fall back to legacy role field
          if (user.primaryRole || user.role) {
            const effectiveRole = user.primaryRole || user.role;
            console.log('ProtectedRoute - Setting user role:', effectiveRole);
            setUserRole(effectiveRole);
          } else {
            console.warn('ProtectedRoute - No role in user data');
            // Set a default role to ensure basic access
            setUserRole('SP'); // Service Provider as default
          }
        } catch (error) {
          console.error('ProtectedRoute - Error parsing user data:', error);
          setIsAuthenticated(false);
        }
      } else {
        console.log('ProtectedRoute - No user data found');
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };
    
    checkAuthentication();
  }, []);

  console.log('ProtectedRoute - State:', { 
    isAuthenticated, 
    userRole, 
    loading, 
    allowedRoles 
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }

  // If role check is required and user doesn't have the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log(`ProtectedRoute - Role ${userRole} not in allowed roles:`, allowedRoles);
    return <Navigate to="/dashboard" />;
  }

  // If authenticated and has the required role, render the component
  console.log('ProtectedRoute - Rendering component');
  return element;
};

function App() {
  // Initialize socket connection when app loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Initializing socket connection');
      initSocket(token);
    }
    
    // Cleanup socket connection when component unmounts
    return () => {
      console.log('Disconnecting socket');
      disconnectSocket();
    };
  }, []);
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatRoutes: true,
          v7_relativeSplatPath: true
        }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/payments" element={<ProtectedRoute element={<Payments />} />} />
          <Route path="/performance" element={<ProtectedRoute element={<Performance />} />} />
          <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
          <Route path="/applicationform" element={<ProtectedRoute element={<ApplicationForm />} />} />
          <Route path="/submissions" element={<ProtectedRoute element={<Submissions />} allowedRoles={['OW', 'RM']} />} />
          
          {/* Owner-only routes */}
          <Route path="/regions" element={<ProtectedRoute element={<Regions />} allowedRoles={['OW']} />} />
        </Routes>
      </Router>
      
      {/* Toast container for notifications */}
      <ToastContainer position="top-right" />
    </div>
  );
}

export default App;
