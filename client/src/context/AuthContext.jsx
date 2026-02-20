import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Create Context Object to share User Authentication Token throughout Foodable application
export const AuthContext = createContext();

// Authentication Component Function that extracts, logs in, and logs out an authenticated user
export function Authentication({ children }) {
    // User, idToken, accessToken variables set to NULL, will store user information here
    const [user, setUser] = useState(null);
    const [idToken, setIdToken] = useState(null);
    const [accessToken, setAccessToken] = useState(null);  

    // Runs once when component is mounted to check if token already in local storage
    useEffect(() => {
        // Try to get idToken and accessToken from local storage
        const storedIdToken = localStorage.getItem('id_token');
        const storedAccessToken = localStorage.getItem('access_token');

        // If token is found, update idToken and user variables by decoming JSON Web Token using jwtDecode function
        if (storedIdToken) {
            setIdToken(storedIdToken);
            setAccessToken(storedAccessToken);
            setUser(jwtDecode(storedIdToken));
        } else {
        // DEV FALLBACK so pages don't hang before Cognito login is wired
        setUser({ "cognito:username": "dev-user" });
        }
    }, []);

    // Login Function that is called after successful login
    const login = (newIdToken, newAccessToken) => {
        // Save idToken and accessToken to local storage to ensure user stays logged in after refresh, acesss different page, etc
        localStorage.setItem('id_token', newIdToken);
        localStorage.setItem('access_token', newAccessToken);
        
        // Update idToken, accessToken, and user state variables
        setIdToken(newIdToken);
        setAccessToken(newAccessToken);
        setUser(jwtDecode(newIdToken));
    };

    // Logout Function that is called after a user logs out
    const logout = () => {
        // Remove idToken and accessToken from local storage
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token'); 

        // Update idToken, accessToken, and user state variables to NULL
        setIdToken(null);
        setAccessToken(null);
        setUser(null);
    }
    
    // Ensure authentication data is passed down to all child componenets
    return (
        <AuthContext.Provider value={{ user, idToken, accessToken, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}