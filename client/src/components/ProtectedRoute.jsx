// client/src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, authReady } = useContext(AuthContext);
  const location = useLocation();

  // Wait until AuthContext finishes checking localStorage
  if (!authReady) return <p>Loading...</p>;

  // If not logged in, kick them to Home
  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}