import { useEffect, useState, useContext } from "react";
import axios from "axios";
import React from "react";
import { AuthContext } from "../context/AuthContext.jsx";

function Home() {
  const { user, authReady } = useContext(AuthContext);

  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  const COGNITO_LOGIN_URL =
    "https://us-east-20wnkbkk1l.auth.us-east-2.amazoncognito.com/login?client_id=1ersrvdta79prnn3uip16snfck&response_type=token&scope=email+openid+phone&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Floggedin";

  useEffect(() => {
    axios
      .get("/api/health")
      .then((r) => setHealth(r.data))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Foodable MERN Hello</h1>
      <p>Frontend is running</p>

      {!authReady ? (
        <p>Checking login status...</p>
      ) : user ? (
        <p style={{ marginTop: 8 }}>
          You are logged in as <b>{user["cognito:username"]}</b>.
        </p>
      ) : (
        <p style={{ marginTop: 8 }}>
          <a href={COGNITO_LOGIN_URL}>Register or Login</a>
        </p>
      )}

      <h2 style={{ marginTop: 20 }}>API health</h2>

      {error && <pre>{error}</pre>}

      {health ? (
        <pre>{JSON.stringify(health, null, 2)}</pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Home;