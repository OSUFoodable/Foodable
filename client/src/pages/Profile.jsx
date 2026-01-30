import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext.jsx";

export default function Profile() {
  const { user } = useContext(AuthContext);
  if (!user) return <p>Loading user information...</p>;
  
  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>Welcome, {user["cognito:username"]}!</h2>
      <h1>Profile</h1>
      <p>Profile settings and dietary preferences. (placeholder)</p>
    </div>
  );
}
