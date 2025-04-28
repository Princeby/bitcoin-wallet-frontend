import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import { AuthProvider } from './context/AuthProvider';
import AuthContext from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  
  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes - will redirect to login if not authenticated */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  {/* Dashboard component will go here */}
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Welcome to your Bitcoin Wallet Dashboard</h1>
                    <p className="mt-4">Your wallet dashboard is under construction</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect to login by default */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={5000} />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;