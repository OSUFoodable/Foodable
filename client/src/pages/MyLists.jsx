// Foodable/client/src/pages/MyLists.jsx
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { fetchLists, deleteList, renameList, updateList } from "../services/myListsService.js";

export default function MyLists() {
  const { user } = useContext(AuthContext);

  const username =
    user?.["cognito:username"] || user?.username || user?.email || "guest";

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");

  const [editingItemsId, setEditingItemsId] = useState(null);
  const [draftItems, setDraftItems] = useState([]);

  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");

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

        if (!cancelled) {
          setLists(data);
        }
      } catch (err) {
        if (!cancelled) {
          setErrMsg(err.message || "Failed to load lists");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <p className="app-muted" style={{ padding: 24 }}>
        Loading user information...
      </p>
    );
  }

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

            <button
              type="button"
              onClick={loadLists}
              className="app-btn app-btn-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading && <p className="app-muted">Loading lists…</p>}

        {errMsg && <p className="app-error">{errMsg}</p>}

        {!loading && !errMsg && lists.length === 0 && (
          <p className="app-muted">
            No grocery lists saved yet. Generate one in the chatbot and click
            "Save".
          </p>
        )}

        <div className="app-grid">
          {lists.map((list) => (
            <div key={list._id} className="app-card">
              <div
                className="app-flex-between"
                style={{ marginBottom: 10 }}
              >
                <div>
                  {editingId === list._id ? (
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="app-input"
                      style={{ maxWidth: 220 }}
                      autoFocus
                    />
                  ) : (
                    <div style={{ fontWeight: 800, fontSize: 17 }}>
                      {list.title || "Grocery List"}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.6,
                      marginTop: 2,
                    }}
                  >
                    {list.createdAt
                      ? new Date(list.createdAt).toLocaleString()
                      : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {editingId === list._id ? (
                    <>
                      <button
                        type="button"
                        className="app-btn app-btn-sm"
                        onClick={async () => {
                          try {
                            const updated = await renameList(
                              list._id,
                              draftTitle
                            );

                            setLists((prev) =>
                              prev.map((x) =>
                                x._id === list._id ? updated : x
                              )
                            );

                            setEditingId(null);
                            setDraftTitle("");
                          } catch (err) {
                            alert(err.message || "Failed to rename list");
                          }
                        }}
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        className="app-btn app-btn-sm"
                        onClick={() => {
                          setEditingId(null);
                          setDraftTitle("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="app-btn app-btn-sm"
                      onClick={() => {
                        setEditingId(list._id);
                        setDraftTitle(list.title || "Grocery List");
                      }}
                    >
                      Rename
                    </button>
                  )}

                  <button
                    type="button"
                    className="app-btn app-btn-sm"
                    onClick={() => {
                      setEditingItemsId(list._id);
                      setDraftItems(list.items || []);
                    }}
                  >
                    Edit Items
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await deleteList(list._id);

                        setLists((prev) =>
                          prev.filter((x) => x._id !== list._id)
                        );
                      } catch (err) {
                        alert(err.message || "Failed to delete list");
                      }
                    }}
                    className="app-btn app-btn-danger app-btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingItemsId === list._id ? (
                <div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {draftItems.map((item, idx) => (
                      <li
                        key={idx}
                        style={{ marginBottom: 8, fontSize: 14 }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {item.name}
                        </span>

                        {typeof item.qty === "number"
                          ? ` — ${item.qty}`
                          : ""}

                        {item.unit ? ` ${item.unit}` : ""}

                        {item.category ? (
                          <span className="app-muted">
                            {" "}
                            ({item.category})
                          </span>
                        ) : null}

                        <button
                          type="button"
                          className="app-btn app-btn-danger app-btn-sm"
                          style={{ marginLeft: 8 }}
                          onClick={() => {
                            setDraftItems((prev) =>
                              prev.filter((_, i) => i !== idx)
                            );
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      className="app-input"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Item name"
                    />

                    <input
                      className="app-input"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      placeholder="Qty"
                      style={{ maxWidth: 80 }}
                    />

                    <input
                      className="app-input"
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      placeholder="Unit"
                      style={{ maxWidth: 100 }}
                    />

                    <button
                      type="button"
                      className="app-btn app-btn-sm"
                      onClick={() => {
                        const name = newItemName.trim();

                        if (!name) return;

                        setDraftItems((prev) => [
                          ...prev,
                          {
                            name,
                            qty: Number(newItemQty) || 1,
                            unit: newItemUnit.trim() || "count",
                            category: "other",
                          },
                        ]);

                        setNewItemName("");
                        setNewItemQty("");
                        setNewItemUnit("");
                      }}
                    >
                      Add Item
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 12,
                    }}
                  >
                    <button
                      type="button"
                      className="app-btn app-btn-sm"
                      onClick={async () => {
                        try {
                          const updated = await updateList(
                            list._id,
                            {
                              items: draftItems,
                            }
                          );

                          setLists((prev) =>
                            prev.map((x) =>
                              x._id === list._id ? updated : x
                            )
                          );

                          setEditingItemsId(null);
                          setDraftItems([]);
                        } catch (err) {
                          alert(err.message || "Failed to update list");
                        }
                      }}
                    >
                      Save Items
                    </button>

                    <button
                      type="button"
                      className="app-btn app-btn-sm"
                      onClick={() => {
                        setEditingItemsId(null);
                        setDraftItems([]);

                        setNewItemName("");
                        setNewItemQty("");
                        setNewItemUnit("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {(list.items || []).map((item, idx) => (
                    <li
                      key={idx}
                      style={{ marginBottom: 4, fontSize: 14 }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {item.name}
                      </span>

                      {typeof item.qty === "number"
                        ? ` — ${item.qty}`
                        : ""}

                      {item.unit ? ` ${item.unit}` : ""}

                      {item.category ? (
                        <span className="app-muted">
                          {" "}
                          ({item.category})
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
