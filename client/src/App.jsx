// client/src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";

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
import { startLogin } from "./config/cognito.js";

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
          borderBottom: "1px solid rgba(255,255,255,0.07)",
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

          <nav style={{ display: "flex", gap: "0.25rem" }}>
            {/* Always visible */}
            <Link to="/" className="app-nav-link">
              Home
            </Link>

            {/* Only visible when logged in */}
            {user ? (
              <>
                <Link to="/discover" className="app-nav-link">
                  Discover Foods
                </Link>
                <Link to="/ingredients" className="app-nav-link">
                  Ingredients
                </Link>
                <Link to="/recipes" className="app-nav-link">
                  Recipes
                </Link>
                <Link to="/lists" className="app-nav-link">
                  My Lists
                </Link>
                <Link to="/community" className="app-nav-link">
                  Community
                </Link>
                <Link to="/profile" className="app-nav-link">
                  Profile
                </Link>
              </>
            ) : (
              // Only visible when logged out
              <button
                type="button"
                onClick={startLogin}
                className="app-nav-link"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Page content changes here */}
      <main>
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