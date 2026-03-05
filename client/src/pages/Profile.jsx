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

  // Create a stable "safe user" object so hooks always run consistently
  const safeUser = useMemo(() => user || { "cognito:username": "guest" }, [user]);

  // Hooks MUST always run, even when logged out
  const [dietPrefs, setDietPrefs] = useState(() => loadDietPrefs(safeUser));
  const [status, setStatus] = useState("");
  const [savedPosts, setSavedPosts] = useState(() => loadSavedPosts(safeUser));

  // Re-load preferences whenever the user changes (login/logout)
  useEffect(() => {
    setStatus("");

    // If logged out, clear UI state
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
    // clear tokens + auth state
    logout();

    // send them somewhere safe
    navigate("/", { replace: true });
  }

  // After hooks are declared, it's safe to conditionally render
  if (!authReady) return <p>Loading user information...</p>;

  if (!user) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 560 }}>
        <h1>Profile</h1>
        <p>You are logged out. Please log in.</p>
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          style={{
            marginTop: 12,
            padding: "0.6rem 1rem",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            cursor: "pointer",
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 560 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
        }}
      >
        <div>
          <h2>Welcome, {user["cognito:username"]}!</h2>
          <h1>Profile</h1>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>

      <p>Dietary preferences</p>

      <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
        {PREFS.map((p) => {
          const enabled = dietPrefs[p.key];

          return (
            <div
              key={p.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: 14, opacity: 0.75 }}>
                  {enabled ? "Enabled" : "Disabled"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  minWidth: 60,
                }}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => togglePref(p.key)}
                  aria-label={`${p.label} toggle`}
                  style={{
                    width: 18,
                    height: 18,
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
        <button onClick={handleSave} style={{ padding: "0.6rem 1rem" }}>
          Save
        </button>
        {status && <span style={{ alignSelf: "center" }}>{status}</span>}
      </div>

      <hr style={{ margin: "1.5rem 0" }} />

      <h2>Saved Posts</h2>

      {savedPosts.length === 0 ? (
        <p style={{ opacity: 0.75 }}>No saved posts yet.</p>
      ) : (
        <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
          {savedPosts.map((post) => {
            const id = post.id ?? post._id;

            return (
              <article
                key={id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "0.75rem 1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {post.title?.trim() ? post.title : "untitled"}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.75 }}>
                      {post.author || "Anonymous"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => id && setSavedPosts(unsavePost(user, id))}
                    style={{ padding: "0.4rem 0.75rem" }}
                  >
                    Unsave
                  </button>
                </div>

                {post.body && <p style={{ marginTop: 10 }}>{post.body}</p>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}