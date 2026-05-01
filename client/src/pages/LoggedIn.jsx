import React from "react";
import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import {
  exchangeCodeForTokens,
  consumeStoredState,
} from "../config/cognito.js";
import { getDisplayName } from "../utils/authHelpers";

function LoggedIn() {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [statusMsg, setStatusMsg] = useState("Loading user information...");

  // Guard so we only process the redirect once (prevents infinite update loops)
  const didProcess = useRef(false);

  useEffect(() => {
    if (didProcess.current) return;
    didProcess.current = true;

    // Cognito's authorization-code flow returns ?code= and ?state= as query
    // params (not in the hash like the legacy implicit flow).
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      setStatusMsg(`Login failed: ${errorDescription || error}`);
      return;
    }

    if (!code) {
      setStatusMsg("Logged in! (No new code in URL)");
      return;
    }

    // Validate the state parameter for CSRF protection.
    const expectedState = consumeStoredState();
    if (expectedState && returnedState !== expectedState) {
      setStatusMsg("Login failed: state mismatch (possible CSRF).");
      return;
    }

    (async () => {
      try {
        const tokens = await exchangeCodeForTokens(code);
        login(tokens.id_token, tokens.access_token, tokens.refresh_token);

        // Strip the code/state from the URL so they don't persist in history.
        window.history.replaceState({}, document.title, "/loggedin");
        setStatusMsg("Logged in!");
        navigate("/", { replace: true });
      } catch (e) {
        setStatusMsg(
          `Login failed: ${e?.message || "Token exchange failed"}`
        );
      }
    })();
  }, [login, navigate]);

  if (!user) return <p>{statusMsg}</p>;

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <p>You are logged in!!!</p>
      <h2>Welcome, {getDisplayName(user)}!</h2>
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
