// client/src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";

import Home from "./pages/Home.jsx";
import LoggedIn from "./pages/LoggedIn.jsx";
import Discover from "./pages/Discover.jsx";
import Recipes from "./pages/Recipes.jsx";
import MyLists from "./pages/MyLists.jsx";
import Community from "./pages/Community.jsx";
import Profile from "./pages/Profile.jsx";
import IngredientsPage from "./pages/Ingredients.jsx";

import AIChatWidget from "./components/AIChatWidget.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthContext } from "./context/AuthContext.jsx";
import { loadDietPrefs } from "./services/profileService.js";

// Put Hosted UI login link here (same one used in Home.jsx)
const COGNITO_LOGIN_URL =
  "https://us-east-20wnkbkk1l.auth.us-east-2.amazoncognito.com/login?client_id=1ersrvdta79prnn3uip16snfck&response_type=token&scope=email+openid+phone&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Floggedin";

function App() {
  const { user } = useContext(AuthContext);

  const [dietPrefs, setDietPrefs] = useState(null);

  useEffect(() => {
    if (!user) {
      setDietPrefs(null);
      return;
    }
    setDietPrefs(loadDietPrefs(user));
  }, [user]);

  // Small helper so styles stay consistent
  const linkStyle = useMemo(
    () => ({ color: "white", textDecoration: "none" }),
    []
  );

  return (
    <div style={{ fontFamily: "system-ui" }}>
      {/* Top navigation bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "#111",
          color: "#fff",
          padding: "1rem 2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link
            to="/"
            style={{
              fontSize: "1.5rem",
              color: "white",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Foodable
          </Link>

          <nav style={{ display: "flex", gap: "1.25rem" }}>
            {/* Always visible */}
            <Link to="/" style={linkStyle}>
              Home
            </Link>

            {/* Only visible when logged in */}
            {user ? (
              <>
                <Link to="/discover" style={linkStyle}>
                  Discover Foods
                </Link>
                <Link to="/ingredients" style={linkStyle}>
                  Ingredients
                </Link>
                <Link to="/recipes" style={linkStyle}>
                  Recipes
                </Link>
                <Link to="/lists" style={linkStyle}>
                  My Lists
                </Link>
                <Link to="/community" style={linkStyle}>
                  Community
                </Link>
                <Link to="/profile" style={linkStyle}>
                  Profile
                </Link>
              </>
            ) : (
              // Only visible when logged out
              <a href={COGNITO_LOGIN_URL} style={linkStyle}>
                Login
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Page content changes here */}
      <main style={{ padding: "1rem" }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />

          {/* Callback/landing page after Cognito redirect */}
          <Route path="/loggedin" element={<LoggedIn />} />

          {/* Protected */}
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <Discover />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ingredients"
            element={
              <ProtectedRoute>
                <IngredientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRoute>
                <Recipes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lists"
            element={
              <ProtectedRoute>
                <MyLists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* Global AI chat widget — only show when logged in */}
      {user && <AIChatWidget dietPrefs={dietPrefs} />}
    </div>
  );
}

export default App;