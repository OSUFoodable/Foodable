// client/src/pages/Discover.jsx
import { AuthContext } from "../context/AuthContext";
import { useContext, useEffect, useState } from "react";
import axios from "axios";

export default function Discover() {
  const { user } = useContext(AuthContext);

  const [query, setQuery] = useState("yogurt");
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) return <p>Loading user information...</p>;

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError("");

    try {
      const r = await axios.get("/api/foods/search", { params: { q } });
      setFoods(r.data.items || []);
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
          background: "#2a2a2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "1.4rem",
          color: "#aaa",
          userSelect: "none",
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
    <div style={{ padding: "1.5rem" }}>
      <h2>Welcome, {user["cognito:username"]}!</h2>

      <h1>Discover Foods</h1>
      <p>Search for foods and see nutritional + affordability info. (MVP: nutrition)</p>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          marginTop: "1rem",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods (e.g., yogurt, oats, protein bar)"
          style={{
            flex: 1,
            padding: "0.6rem",
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
        />
        <button
          onClick={runSearch}
          style={{ padding: "0.6rem 1rem", borderRadius: 8, cursor: "pointer" }}
        >
          Search
        </button>
      </div>

      {loading && <p style={{ marginTop: "1rem" }}>Loading results...</p>}
      {error && <p style={{ marginTop: "1rem", color: "crimson" }}>{error}</p>}

      <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
        {!loading && !error && foods.length === 0 && (
          <p>No results yet. Try searching for something else.</p>
        )}

        {foods.map((food) => (
          <div
            key={food.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: "0.9rem",
              display: "flex",
              gap: "0.9rem",
              alignItems: "center",
            }}
          >
            {renderFoodThumb(food)}

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{food.name || "Unknown"}</div>
              <div style={{ opacity: 0.75 }}>{food.brand || "No brand listed"}</div>

              <div style={{ marginTop: 6 }}>
                <span>{food?.nutrition?.calories ?? "-"} cal</span>
                {" • "}
                <span>{food?.nutrition?.protein ?? "-"}g protein</span>
                {" • "}
                <span>{food?.nutrition?.carbs ?? "-"}g carbs</span>
                {" • "}
                <span>{food?.nutrition?.fat ?? "-"}g fat</span>
                <span style={{ opacity: 0.7 }}> {nutritionLabel(food)}</span>
              </div>
            </div>

            <button
              onClick={() => console.log("Add to list:", food)}
              style={{
                padding: "0.55rem 0.9rem",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}