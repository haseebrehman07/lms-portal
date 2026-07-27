import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = sessionStorage.getItem('token');
  const role = sessionStorage.getItem('role'); 

  // 1. If there is no token, kick them back to the login page immediately
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. If the route requires specific roles, check if the user is authorized
  if (allowedRoles && !allowedRoles.includes(role)) {
    
    // If an Admin tries to access a student page, send them to the admin dash
    if (role === 'admin' || role === 'manager') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // If a Learner tries to access an admin page, send them to the student dash
    return <Navigate to="/student/dashboard" replace />;
  }

  // 3. If they have a token and the correct role, render the requested page
  return children;
};

export default ProtectedRoute;