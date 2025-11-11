import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import LoggedIn from "./pages/LoggedIn.jsx";
import Discover from "./pages/Discover.jsx";
import Recipes from "./pages/Recipes.jsx";
import MyLists from "./pages/MyLists.jsx";
import Community from "./pages/Community.jsx";
import Profile from "./pages/Profile.jsx";

function App() {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",           // space between logo and links
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "1.5rem" }}>Foodable</div>

          <nav style={{ display: "flex", gap: "1.25rem" }}>
            <Link to="/" style={{ color: "white", textDecoration: "none" }}>
              Home
            </Link>
            <Link to="/discover" style={{ color: "white", textDecoration: "none" }}>
              Discover Foods
            </Link>
            <Link to="/recipes" style={{ color: "white", textDecoration: "none" }}>
              Recipes
            </Link>
            <Link to="/lists" style={{ color: "white", textDecoration: "none" }}>
              My Lists
            </Link>
            <Link to="/community" style={{ color: "white", textDecoration: "none" }}>
              Community
            </Link>
            <Link to="/profile" style={{ color: "white", textDecoration: "none" }}>
              Profile
            </Link>
          </nav>
        </div>
      </header>

      {/* Page content changes here */}
      <main style={{ padding: "1rem" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/loggedin" element={<LoggedIn />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/lists" element={<MyLists />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
