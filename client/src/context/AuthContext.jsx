// client\src\context\AuthContext.jsx
import { createContext, useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { syncUser } from "../services/authService";

// Create Context Object to share User Authentication Token throughout Foodable application
export const AuthContext = createContext();

const DEFAULT_DIET_PREFS = {
  vegetarian: false,
  vegan: false,
  pescatarian: false,
};

// Authentication Component Function that extracts, logs in, and logs out an authenticated user
export function Authentication({ children }) {
  // User, idToken, accessToken variables set to NULL, will store user information here
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // The persisted User document the backend returns from /api/auth/sync
  const [dbUser, setDbUser] = useState(null);

  // Shared diet preferences state for the current session
  const [dietPrefs, setDietPrefs] = useState(DEFAULT_DIET_PREFS);

  // Tracks when we have finished the initial auth check (so pages don't hang)
  const [authReady, setAuthReady] = useState(false);

  // Guard so initialization only runs once (prevents StrictMode double-run issues)
  const didInit = useRef(false);

  // Sync the Cognito identity to the backend User collection. Best-effort:
  // the UI keeps working if this fails (subsequent owned-resource calls will 401
  // until sync succeeds, but auth state itself is still valid).
  async function syncToBackend(idTokenForSync) {
    try {
      const synced = await syncUser(idTokenForSync);
      setDbUser(synced);
      if (synced?.dietPrefs) {
        setDietPrefs({ ...DEFAULT_DIET_PREFS, ...synced.dietPrefs });
      }
    } catch (err) {
      console.warn("[AuthContext] backend user sync failed:", err.message);
    }
  }

  // Runs once when component is mounted to check if token already in local storage
  useEffect(() => {
    // Prevent running twice in React StrictMode
    if (didInit.current) return;
    didInit.current = true;

    // Try to get idToken, accessToken, and refreshToken from local storage
    const storedIdToken = localStorage.getItem("id_token");
    const storedAccessToken = localStorage.getItem("access_token");
    const storedRefreshToken = localStorage.getItem("refresh_token");

    // If token is found, update idToken and user variables by decoding JSON Web Token using jwtDecode function
    if (storedIdToken) {
      try {
        setIdToken(storedIdToken);
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setUser(jwtDecode(storedIdToken));
        setDietPrefs(DEFAULT_DIET_PREFS);
        // Fire-and-forget; don't block the UI on the network call.
        syncToBackend(storedIdToken);
      } catch {
        // If token is invalid/expired/corrupt, clear it out
        localStorage.removeItem("id_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setIdToken(null);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        setDbUser(null);
        setDietPrefs(DEFAULT_DIET_PREFS);
      } finally {
        setAuthReady(true);
      }
      return;
    }

    // DEV FALLBACK so pages don't hang before Cognito login is wired
    // Only enable when you explicitly set VITE_DEV_AUTH_BYPASS=true
    const devBypass = import.meta.env.VITE_DEV_AUTH_BYPASS === "true";
    if (devBypass) {
      setUser({
        "cognito:username": "dev-user",
        email: "dev-user@example.com",
      });
      setDietPrefs(DEFAULT_DIET_PREFS);
    } else {
      setUser(null);
      setDietPrefs(DEFAULT_DIET_PREFS);
    }

    setAuthReady(true);
  }, []);

  // Login Function that is called after successful login
  const login = (newIdToken, newAccessToken, newRefreshToken) => {
    // Save tokens to local storage to ensure user stays logged in after refresh, access different page, etc
    localStorage.setItem("id_token", newIdToken);
    localStorage.setItem("access_token", newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem("refresh_token", newRefreshToken);
    }

    // Update token and user state variables
    setIdToken(newIdToken);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken || null);

    // Decode user safely
    try {
      setUser(jwtDecode(newIdToken));
    } catch {
      setUser(null);
    }

    // Reset diet prefs for the new login session
    setDietPrefs(DEFAULT_DIET_PREFS);

    // We are definitely ready after a login
    setAuthReady(true);

    // Tell the backend who just signed in so it can upsert a User record.
    // Fire-and-forget; UI stays responsive if the server is down.
    syncToBackend(newIdToken);
  };

  // Logout Function that is called after a user logs out
  const logout = () => {
    // Remove tokens from local storage
    localStorage.removeItem("id_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    // Update token and user state variables to NULL
    setIdToken(null);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setDbUser(null);
    setDietPrefs(DEFAULT_DIET_PREFS);
  };

  // Ensure authentication data is passed down to all child components
  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        idToken,
        accessToken,
        refreshToken,
        authReady,
        dietPrefs,
        setDietPrefs,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
