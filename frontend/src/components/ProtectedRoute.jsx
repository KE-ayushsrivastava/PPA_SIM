import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>; // ya spinner
  }

  if (!user) {
    // agar user null hai to login page bhej do
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
