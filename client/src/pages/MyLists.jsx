import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export default function MyLists() {
  const { user } = useContext(AuthContext);
  if (!user) return <p>Loading user information...</p>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>Welcome, {user["cognito:username"]}!</h2>
      <h1>My Lists</h1>
      <p>View and manage your grocery lists. (placeholder)</p>
    </div>
  );
}
