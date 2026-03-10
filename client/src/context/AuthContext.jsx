// AuthContext.jsx
import { createContext, useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";

// Create Context Object to share User Authentication Token throughout Foodable application
export const AuthContext = createContext();

// Authentication Component Function that extracts, logs in, and logs out an authenticated user
export function Authentication({ children }) {
  // User, idToken, accessToken variables set to NULL, will store user information here
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // Tracks when we have finished the initial auth check (so pages don't hang)
  const [authReady, setAuthReady] = useState(false);

  // Guard so initialization only runs once (prevents StrictMode double-run issues)
  const didInit = useRef(false);

  // Runs once when component is mounted to check if token already in local storage
  useEffect(() => {
    // Prevent running twice in React StrictMode
    if (didInit.current) return;
    didInit.current = true;

    // Try to get idToken and accessToken from local storage
    const storedIdToken = localStorage.getItem("id_token");
    const storedAccessToken = localStorage.getItem("access_token");

    // If token is found, update idToken and user variables by decoding JSON Web Token using jwtDecode function
    if (storedIdToken) {
      try {
        setIdToken(storedIdToken);
        setAccessToken(storedAccessToken);
        setUser(jwtDecode(storedIdToken));
      } catch {
        // If token is invalid/expired/corrupt, clear it out
        localStorage.removeItem("id_token");
        localStorage.removeItem("access_token");
        setIdToken(null);
        setAccessToken(null);
        setUser(null);
      } finally {
        setAuthReady(true);
      }
      return;
    }

    // DEV FALLBACK so pages don't hang before Cognito login is wired
    // Only enable when you explicitly set VITE_DEV_AUTH_BYPASS=true
    const devBypass = import.meta.env.VITE_DEV_AUTH_BYPASS === "true";
    if (devBypass) {
      setUser({ "cognito:username": "dev-user" });
    } else {
      setUser(null);
    }

    setAuthReady(true);
  }, []);

  // Login Function that is called after successful login
  const login = (newIdToken, newAccessToken) => {
    // Save idToken and accessToken to local storage to ensure user stays logged in after refresh, access different page, etc
    localStorage.setItem("id_token", newIdToken);
    localStorage.setItem("access_token", newAccessToken);

    // Update idToken, accessToken, and user state variables
    setIdToken(newIdToken);
    setAccessToken(newAccessToken);

    // Decode user safely
    try {
      setUser(jwtDecode(newIdToken));
    } catch {
      setUser(null);
    }

    // We are definitely ready after a login
    setAuthReady(true);
  };

  // Logout Function that is called after a user logs out
  const logout = () => {
    // Remove idToken and accessToken from local storage
    localStorage.removeItem("id_token");
    localStorage.removeItem("access_token");

    // Update idToken, accessToken, and user state variables to NULL
    setIdToken(null);
    setAccessToken(null);
    setUser(null);
  };

  // Ensure authentication data is passed down to all child components
  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        accessToken,
        authReady,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}