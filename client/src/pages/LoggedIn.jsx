import React from "react";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

function LoggedIn() {
    const { user, logout } = useContext(AuthContext);

    if (!user) return <p>Loading user information...</p>;

    return (
        <div>
            <p> You are logged in!!!</p>
            <h2>Welcome, {user["cognito:username"]}!</h2>
            <p>Email: {user.email}</p>
        </div>
    );
}   

export default LoggedIn;