// Profile.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { loadDietPrefs, saveDietPrefs } from "../services/profileService";
import { loadSavedPosts, unsavePost } from "../services/savedPostsService";
import { AuthContext } from "../context/AuthContext.jsx";

const PREFS = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "pescatarian", label: "Pescatarian" },
];

export default function Profile() {
  const { user, authReady, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const safeUser = useMemo(() => user || { "cognito:username": "guest" }, [user]);

  const [dietPrefs, setDietPrefs] = useState(() => loadDietPrefs(safeUser));
  const [status, setStatus] = useState("");
  const [savedPosts, setSavedPosts] = useState(() => loadSavedPosts(safeUser));

  useEffect(() => {
    setStatus("");
    if (!user) {
      setDietPrefs(loadDietPrefs({ "cognito:username": "guest" }));
      setSavedPosts([]);
      return;
    }
    setDietPrefs(loadDietPrefs(user));
    setSavedPosts(loadSavedPosts(user));
  }, [user]);

  function togglePref(key) {
    setDietPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setStatus("");
  }

  function handleSave() {
    if (!user) {
      setStatus("You must be logged in to save preferences.");
      return;
    }
    saveDietPrefs(user, dietPrefs);
    setStatus("Saved!");
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  if (!authReady) return <p className="app-muted" style={{ padding: 24 }}>Loading user information...</p>;

  if (!user) {
    return (
      <div className="app-page">
        <div className="app-shell" style={{ maxWidth: 560 }}>
          <h1 className="app-title" style={{ marginBottom: 12 }}>Profile</h1>
          <p className="app-muted">You are logged out. Please log in.</p>
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="app-btn"
            style={{ marginTop: 12 }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const initial = (user["cognito:username"]?.[0] || "U").toUpperCase();

  return (
    <div className="app-page">
      <div className="app-shell" style={{ maxWidth: 600 }}>
        {/* Header */}
        <div className="app-card-hero" style={{ marginBottom: 16 }}>
          <div className="app-flex-between">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="app-avatar" style={{ width: 48, height: 48, fontSize: 20 }}>
                {initial}
              </div>
              <div>
                <h1 className="app-title">{user["cognito:username"]}</h1>
                <p className="app-subtitle">Profile</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="app-btn app-btn-danger app-btn-sm"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Dietary preferences */}
        <div className="app-card" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>Dietary preferences</h2>

          <div className="app-grid" style={{ marginBottom: 12 }}>
            {PREFS.map((p) => {
              const enabled = dietPrefs[p.key];

              return (
                <div
                  key={p.key}
                  className="app-card"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.label}</div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                      {enabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => togglePref(p.key)}
                    aria-label={`${p.label} toggle`}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={handleSave} className="app-btn app-btn-primary">
              Save
            </button>
            {status && <span style={{ fontSize: 13, opacity: 0.85 }}>{status}</span>}
          </div>
        </div>

        {/* Saved posts */}
        <div className="app-card">
          <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>Saved Posts</h2>

          {savedPosts.length === 0 ? (
            <p className="app-muted" style={{ margin: 0 }}>No saved posts yet.</p>
          ) : (
            <div className="app-grid">
              {savedPosts.map((post) => {
                const id = post.id ?? post._id;

                return (
                  <article key={id} className="app-card">
                    <div className="app-flex-between">
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          {post.title?.trim() ? post.title : "untitled"}
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.7 }}>
                          {post.author || "Anonymous"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => id && setSavedPosts(unsavePost(user, id))}
                        className="app-btn app-btn-danger app-btn-sm"
                      >
                        Unsave
                      </button>
                    </div>

                    {post.body && (
                      <p style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>{post.body}</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
