import { useEffect, useState } from "react";
import axios from "axios";

function App() {
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
      <h2>API health</h2>
      {error && <pre>{error}</pre>}
      {health ? <pre>{JSON.stringify(health, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
}

export default App;
