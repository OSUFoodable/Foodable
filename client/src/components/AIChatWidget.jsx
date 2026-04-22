// client/src/components/AIChatWidget.jsx
import { useContext, useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../services/aiChatService";
import { createListFromAI } from "../services/myListsService";
import { AuthContext } from "../context/AuthContext.jsx";

export default function AIChatWidget() {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const dietPrefs =
    auth?.dietPrefs ?? {
      vegetarian: false,
      vegan: false,
      pescatarian: false,
    };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can generate a grocery list. Tell me your goal (low-cal / high-protein) and how many meals/days.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastGroceryList, setLastGroceryList] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function onSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setSaveStatus("");

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const data = await sendChatMessage(next, dietPrefs);

      const replyText =
        typeof data?.reply === "string"
          ? data.reply
          : "Sorry, I couldn't generate a response.";

      setMessages((m) => [...m, { role: "assistant", content: replyText }]);

      if (Array.isArray(data?.groceryList) && data.groceryList.length > 0) {
        setLastGroceryList(data.groceryList);
      } else {
        setLastGroceryList(null);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Sorry—something went wrong talking to the server.",
        },
      ]);
      setLastGroceryList(null);
    } finally {
      setLoading(false);
    }
  }

  async function onSaveList() {
    if (!user) {
      setSaveStatus("Please log in to save.");
      return;
    }

    if (!Array.isArray(lastGroceryList) || lastGroceryList.length === 0) {
      setSaveStatus("No grocery list to save yet.");
      return;
    }

    try {
      setSaving(true);
      setSaveStatus("");

      const title = "AI Grocery List";
      await createListFromAI(user, title, lastGroceryList);

      setSaveStatus("Saved to My Lists!");
    } catch (err) {
      setSaveStatus(err?.message || "Failed to save list.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 9999 }}>
      {open && (
        <div
          style={{
            width: 360,
            height: 460,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 700,
            }}
          >
            <span>Foodable Assistant</span>
            <button
              onClick={() => setOpen(false)}
              style={{
                border: "1px solid #ddd",
                background: "transparent",
                fontSize: 16,
                cursor: "pointer",
                lineHeight: 1,
                borderRadius: 6,
                padding: "2px 6px",
                color: "#555",
              }}
              aria-label="Close chat"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div style={{ padding: 10, flex: 1, overflowY: "auto" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  display: "flex",
                  justifyContent:
                    m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "8px 10px",
                    borderRadius: 12,
                    background: m.role === "user" ? "#f0f0f0" : "#fff7e6",
                    border: "1px solid #e5e7eb",
                    whiteSpace: "pre-wrap",
                    fontSize: 14,
                    color: "#111",
                    opacity: 1,
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {Array.isArray(lastGroceryList) && lastGroceryList.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={onSaveList}
                  disabled={saving}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    cursor: saving ? "not-allowed" : "pointer",
                    background: "#111",
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  {saving ? "Saving..." : "Save to My Lists"}
                </button>

                {saveStatus && (
                  <div
                    style={{
                      alignSelf: "center",
                      fontSize: 12,
                      opacity: 0.8,
                    }}
                  >
                    {saveStatus}
                  </div>
                )}
              </div>
            )}

            <div ref={endRef} />
          </div>

          <form
            onSubmit={onSend}
            style={{
              display: "flex",
              gap: 8,
              padding: 10,
              borderTop: "1px solid #eee",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? "Thinking..." : "Ask for a grocery list..."}
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 10px",
                borderRadius: 10,
                border: "1px solid #ddd",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: 0,
                cursor: loading ? "not-allowed" : "pointer",
                background: "#111",
                color: "white",
                fontWeight: 600,
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 16px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          cursor: "pointer",
          background: "#111",
          color: "white",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "inherit",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
        aria-label="Open Foodable AI Assistant"
        title="Foodable AI Assistant"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>💬</span>
        AI Assistant
      </button>
    </div>
  );
}