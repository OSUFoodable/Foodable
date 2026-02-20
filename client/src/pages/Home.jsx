import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";

function Home() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("/api/health")
      .then(r => setHealth(r.data))
      .catch(e => setError(e.message));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Foodable MERN Hello</h1>
      <p>Frontend is running</p>
      <p><a href="https://us-east-20wnkbkk1l.auth.us-east-2.amazoncognito.com/login?client_id=1ersrvdta79prnn3uip16snfck&response_type=token&scope=email+openid+phone&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Floggedin">Register or Login</a></p>
      <h2>API health</h2>
      {error && <pre>{error}</pre>}
      {health ? <pre>{JSON.stringify(health, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
}

export default Home;

