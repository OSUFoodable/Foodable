import React from "react";
import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

// Helper to parse tokens returned in the URL hash from Cognito Hosted UI
function parseHashTokens(hash) {
  // hash looks like: "#id_token=...&access_token=...&expires_in=3600&token_type=Bearer"
  const raw = (hash || "").startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);

  return {
    idToken: params.get("id_token"),
    accessToken: params.get("access_token"),
    error: params.get("error"),
    errorDescription: params.get("error_description"),
  };
}

function LoggedIn() {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Local message so we can show what's happening while we process the redirect
  const [statusMsg, setStatusMsg] = useState("Loading user information...");

  // Guard so we only process the redirect once (prevents infinite update loops)
  const didProcess = useRef(false);

  useEffect(() => {
    if (didProcess.current) return;
    didProcess.current = true;

    // Read tokens from the redirect URL (Cognito puts them in the hash)
    const { idToken, accessToken, error, errorDescription } = parseHashTokens(
      window.location.hash
    );

    // If Cognito returned an error, show it
    if (error) {
      setStatusMsg(`Login failed: ${errorDescription || error}`);
      return;
    }

    // If we received tokens, store them through AuthContext
    if (idToken && accessToken) {
      try {
        login(idToken, accessToken);

        // Clear tokens from the URL so they don't remain in browser history
        window.history.replaceState({}, document.title, "/loggedin");

        setStatusMsg("Logged in!");

        // Send them somewhere useful after login
        navigate("/", { replace: true });
        return;
      } catch (e) {
        setStatusMsg(`Login failed: ${e?.message || "Could not decode token"}`);
        return;
      }
    }

    // If no tokens are present, user might have refreshed /loggedin
    setStatusMsg("Logged in! (No new token in URL)");
  }, [login, navigate]);

  // If we still don't have a user, show status message (instead of hanging forever)
  if (!user) return <p>{statusMsg}</p>;

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <p>You are logged in!!!</p>
      <h2>Welcome, {user["cognito:username"]}!</h2>
      <p>Email: {user.email}</p>

      <button
        type="button"
        onClick={() => {
          logout();
          navigate("/", { replace: true });
        }}
        style={{
          marginTop: 16,
          padding: "0.6rem 1rem",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          cursor: "pointer",
        }}
      >
        Log out
      </button>
    </div>
  );
}

export default LoggedIn;