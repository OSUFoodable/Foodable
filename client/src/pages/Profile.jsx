// Profile.jsx
import { useEffect, useState } from "react";
import { loadDietPrefs, saveDietPrefs } from "../services/profileService";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext.jsx";
import { loadSavedPosts, unsavePost } from "../services/savedPostsService";
import { AuthContext } from "../context/AuthContext.jsx";

const PREFS = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "pescatarian", label: "Pescatarian" },
];

export default function Profile() {
  const { user } = useContext(AuthContext);
  if (!user) return <p>Loading user information...</p>;

  const [dietPrefs, setDietPrefs] = useState(() => loadDietPrefs(user));
  const [status, setStatus] = useState("");
  const [savedPosts, setSavedPosts] = useState(() => loadSavedPosts(user));

  // Optional: re-load preferences if they are ever changed outside this page
  useEffect(() => {
    setDietPrefs(loadDietPrefs(user));
    setSavedPosts(loadSavedPosts(user));
  }, [user]);

  function togglePref(key) {
    setDietPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setStatus("");
  }

  function handleSave() {
    saveDietPrefs(user, dietPrefs);
    setStatus("Saved!");
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 560 }}>
      <h2>Welcome, {user["cognito:username"]}!</h2>
      <h1>Profile</h1>
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
