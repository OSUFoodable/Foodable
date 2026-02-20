import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

export default function Discover() {
  const { user } = useContext(AuthContext);
  if (!user) return <p>Loading user information...</p>;
  
  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>Welcome, {user["cognito:username"]}!</h2>
      <h1>Discover Foods</h1>
      <p>Search for foods and see nutritional + affordability info. (placeholder)</p>
    </div>
  );
}
