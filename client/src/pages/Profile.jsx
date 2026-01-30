// Profile.jsx
import { useEffect, useState } from "react";
import { loadDietPrefs, saveDietPrefs } from "../services/profileService";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext.jsx";

const PREFS = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "pescatarian", label: "Pescatarian" },
];

export default function Profile() {
  const { user } = useContext(AuthContext);
  if (!user) return <p>Loading user information...</p>;

  const [dietPrefs, setDietPrefs] = useState(loadDietPrefs());
  const [status, setStatus] = useState("");

  // Optional: re-load preferences if they are ever changed outside this page
  useEffect(() => {
    setDietPrefs(loadDietPrefs());
  }, []);

  function togglePref(key) {
    setDietPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setStatus("");
  }

  function handleSave() {
    saveDietPrefs(dietPrefs);
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
    </div>
  );
}
