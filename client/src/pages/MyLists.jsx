// Foodable/client/src/pages/MyLists.jsx
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { fetchLists, deleteList } from "../services/myListsService.js";

export default function MyLists() {
  const { user } = useContext(AuthContext);

  const username =
    user?.["cognito:username"] || user?.username || user?.email || "guest";

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  async function loadLists() {
    if (!user) return;
    try {
      setLoading(true);
      setErrMsg("");
      const data = await fetchLists(user);
      setLists(data);
    } catch (err) {
      setErrMsg(err.message || "Failed to load lists");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrMsg("");
        const data = await fetchLists(user);
        if (!cancelled) setLists(data);
      } catch (err) {
        if (!cancelled) setErrMsg(err.message || "Failed to load lists");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return <p>Loading user information...</p>;

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900 }}>
      <h2>Welcome, {username}!</h2>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>My Lists</h1>

        <button
          type="button"
          onClick={loadLists}
          style={{
            padding: "0.5rem 0.75rem",
            cursor: "pointer",
            borderRadius: 10,
          }}
        >
          Refresh
        </button>
      </div>

      {loading && <p>Loading lists...</p>}
      {errMsg && <p style={{ color: "crimson" }}>{errMsg}</p>}

      {!loading && !errMsg && lists.length === 0 && (
        <p style={{ opacity: 0.75 }}>
          No grocery lists saved yet. Generate one in the chatbot and click “Save”.
        </p>
      )}

      <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
        {lists.map((list) => (
          <div
            key={list._id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>
                  {list.title || "Grocery List"}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {list.createdAt ? new Date(list.createdAt).toLocaleString() : ""}
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await deleteList(list._id);
                    setLists((prev) => prev.filter((x) => x._id !== list._id));
                  } catch (err) {
                    alert(err.message || "Failed to delete list");
                  }
                }}
                style={{
                  padding: "0.5rem 0.75rem",
                  cursor: "pointer",
                  borderRadius: 10,
                }}
              >
                Delete
              </button>
            </div>

            <ul style={{ marginTop: 12, paddingLeft: 18 }}>
              {(list.items || []).map((item, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  {typeof item.qty === "number" ? ` — ${item.qty}` : ""}
                  {item.unit ? ` ${item.unit}` : ""}
                  {item.category ? (
                    <span style={{ opacity: 0.7 }}> ({item.category})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}