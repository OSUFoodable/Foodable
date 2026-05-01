// Foodable/client/src/pages/MyLists.jsx
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { fetchLists, deleteList } from "../services/myListsService.js";
import { getDisplayName } from "../utils/authHelpers";

export default function MyLists() {
  const { user } = useContext(AuthContext);

  const username = getDisplayName(user);

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  async function loadLists() {
    if (!user) return;
    try {
      setLoading(true);
      setErrMsg("");
      const data = await fetchLists();
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
        const data = await fetchLists();
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

  if (!user) return <p className="app-muted" style={{ padding: 24 }}>Loading user information...</p>;

  return (
    <div className="app-page">
      <div className="app-shell">
        {/* Header */}
        <div className="app-card-hero" style={{ marginBottom: 16 }}>
          <div className="app-flex-between">
            <div>
              <h1 className="app-title">My Lists</h1>
              <p className="app-subtitle">Welcome, {username}</p>
            </div>
            <button type="button" onClick={loadLists} className="app-btn app-btn-sm">
              Refresh
            </button>
          </div>
        </div>

        {loading && <p className="app-muted">Loading lists…</p>}
        {errMsg && <p className="app-error">{errMsg}</p>}

        {!loading && !errMsg && lists.length === 0 && (
          <p className="app-muted">
            No grocery lists saved yet. Generate one in the chatbot and click "Save".
          </p>
        )}

        <div className="app-grid">
          {lists.map((list) => (
            <div key={list._id} className="app-card">
              <div className="app-flex-between" style={{ marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>
                    {list.title || "Grocery List"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
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
                  className="app-btn app-btn-danger app-btn-sm"
                >
                  Delete
                </button>
              </div>

              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {(list.items || []).map((item, idx) => (
                  <li key={idx} style={{ marginBottom: 4, fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    {typeof item.qty === "number" ? ` — ${item.qty}` : ""}
                    {item.unit ? ` ${item.unit}` : ""}
                    {item.category ? (
                      <span className="app-muted"> ({item.category})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
