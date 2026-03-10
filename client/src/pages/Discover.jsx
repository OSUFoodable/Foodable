// client/src/pages/Discover.jsx
import { AuthContext } from "../context/AuthContext";
import { useContext, useEffect, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

export default function Discover() {
  const { user, authReady } = useContext(AuthContext);

  const [query, setQuery] = useState("yogurt");
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!authReady) return <p className="app-muted" style={{ padding: 24 }}>Loading user information...</p>;
  if (!user) return <p className="app-muted" style={{ padding: 24 }}>You are logged out. Please log in.</p>;

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError("");

    try {
      const data = await apiFetch(`/api/foods/search?q=${encodeURIComponent(q)}`, {
        method: "GET",
      });

      setFoods(data?.items || []);
    } catch (e) {
      setError(e?.message || "Search failed");
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderFoodThumb = (food) => {
    const fallbackLetter = (food.name?.[0] || "?").toUpperCase();

    if (food.imageUrl) {
      return (
        <img
          src={food.imageUrl}
          alt={food.name}
          style={{
            width: 72,
            height: 72,
            objectFit: "cover",
            borderRadius: 10,
            background: "#1e1e1e",
            flexShrink: 0,
          }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }

    return (
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 10,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "1.4rem",
          color: "rgba(255,255,255,0.4)",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {fallbackLetter}
      </div>
    );
  };

  const nutritionLabel = (food) => {
    const b = food?.nutritionBasis;
    if (b?.per === "serving") {
      const amt = b.amount ?? "";
      const unit = b.unit ?? "";
      return `(per serving ${amt}${unit ? unit : ""})`;
    }
    return "(per 100g)";
  };

  return (
    <div className="app-page">
      <div className="app-shell">
        {/* Header */}
        <div className="app-card-hero" style={{ marginBottom: 16 }}>
          <div className="app-flex-between" style={{ flexWrap: "wrap" }}>
            <div>
              <h1 className="app-title">Discover Foods</h1>
              <p className="app-subtitle">Search for foods and see nutritional &amp; affordability info.</p>
            </div>
            <span className="app-muted" style={{ fontSize: 13 }}>{user["cognito:username"]}</span>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods (e.g., yogurt, oats, protein bar)"
            className="app-input"
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
          />
          <button onClick={runSearch} className="app-btn app-btn-primary">
            Search
          </button>
        </div>

        {loading && <p className="app-muted">Loading results…</p>}
        {error && <p className="app-error">{error}</p>}

        <div className="app-grid">
          {!loading && !error && foods.length === 0 && (
            <p className="app-muted">No results yet. Try searching for something.</p>
          )}

          {foods.map((food) => (
            <div
              key={food.id}
              className="app-card"
              style={{ display: "flex", gap: 14, alignItems: "center" }}
            >
              {renderFoodThumb(food)}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{food.name || "Unknown"}</div>
                <div className="app-muted" style={{ fontSize: 13 }}>{food.brand || "No brand listed"}</div>

                <div style={{ marginTop: 6, fontSize: 13 }}>
                  <span>{food?.nutrition?.calories ?? "-"} cal</span>
                  {" • "}
                  <span>{food?.nutrition?.protein ?? "-"}g protein</span>
                  {" • "}
                  <span>{food?.nutrition?.carbs ?? "-"}g carbs</span>
                  {" • "}
                  <span>{food?.nutrition?.fat ?? "-"}g fat</span>
                  <span className="app-muted"> {nutritionLabel(food)}</span>
                </div>
              </div>

              <button
                onClick={() => console.log("Add to list:", food)}
                className="app-btn app-btn-sm"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
