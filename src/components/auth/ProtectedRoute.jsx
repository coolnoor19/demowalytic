// src/components/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!token || !user) {
    return (
      // <Navigate
      //   to={`/login?next=${encodeURIComponent(location.pathname)}`}
      //   replace
      // />
      <Navigate to="/" replace />
    );
  }

  return children;
}
