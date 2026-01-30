import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext.jsx";

export default function Community() {
  const { user, logout } = useContext(AuthContext);
  if (!user) return <p>Loading user information...</p>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>Welcome, {user["cognito:username"]}!</h2>
      <h1>Community</h1>
      <p>See posts and activity from other Foodable users. (placeholder)</p>
    </div>
  );
}
