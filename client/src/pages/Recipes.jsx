// src/pages/Recipes.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { generateRecipe } from "../services/recipesService";
import { AuthContext } from "../context/AuthContext.jsx";

const RECIPE_DRAFT_KEY = "foodable_recipe_ingredients_draft";
const INGREDIENTS_KEY = "foodable_ingredients_v1";
const STAPLES_KEY = "foodable_ing_staples_v1";
const STAPLES_STATE_KEY = "foodable_ing_staples_state_v1";
const STORED_RECIPES_KEY = "foodable_generated_recipes_v1";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeString(v) {
  return String(v || "").trim();
}

function safeLower(v) {
  return normalizeString(v).toLowerCase();
}

function makeRecipeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `recipe_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function buildAvailableIngredients() {
  const draft = readJson(RECIPE_DRAFT_KEY, []);
  if (Array.isArray(draft) && draft.length > 0) {
    return draft
      .map((item) => ({
        name: normalizeString(item?.name),
        qty: item?.qty,
        unit: normalizeString(item?.unit) || undefined,
      }))
      .filter((item) => item.name);
  }

  const items = readJson(INGREDIENTS_KEY, []);
  const staples = readJson(STAPLES_KEY, []);
  const staplesState = readJson(STAPLES_STATE_KEY, {});

  const out = [];
  const seen = new Set();

  for (const item of items) {
    const name = normalizeString(item?.name);
    if (!name) continue;

    const key = safeLower(name);
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      name,
      qty: item?.qty,
      unit: normalizeString(item?.unit) || undefined,
    });
  }

  for (const staple of staples) {
    const name = normalizeString(staple);
    if (!name) continue;
    if (!staplesState[safeLower(name)]) continue;

    const key = safeLower(name);
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({ name });
  }

  return out;
}

function formatAvailableIngredient(item) {
  const name = normalizeString(item?.name);
  const qty = item?.qty;
  const unit = normalizeString(item?.unit);

  if (qty != null && unit) return `${name} (${qty} ${unit})`;
  if (qty != null) return `${name} (${qty})`;
  return name;
}

function loadStoredRecipes() {
  const stored = readJson(STORED_RECIPES_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

function saveStoredRecipes(recipes) {
  writeJson(STORED_RECIPES_KEY, recipes);
}

export default function Recipes() {
  const { user } = useContext(AuthContext);

  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <p className="app-muted" style={{ padding: 24 }}>
        Loading user information...
      </p>
    );
  }

  useEffect(() => {
    const nextIngredients = buildAvailableIngredients();
    const storedRecipes = loadStoredRecipes();

    setAvailableIngredients(nextIngredients);
    setRecipes(storedRecipes);
    setExpandedId(storedRecipes[0]?.id || null);
  }, []);

  const ingredientCount = availableIngredients.length;

  const ingredientPreview = useMemo(() => {
    return availableIngredients.slice(0, 8);
  }, [availableIngredients]);

  async function handleGenerate() {
    setLoading(true);
    setError("");

    try {
      const ingredients = buildAvailableIngredients();
      setAvailableIngredients(ingredients);

      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        throw new Error("No ingredients available. Add or select ingredients first.");
      }

      const data = await generateRecipe({ ingredients });

      const newRecipe = {
        id: makeRecipeId(),
        title: normalizeString(data?.title) || "Untitled Recipe",
        summary: normalizeString(data?.summary) || "Generated from your available ingredients.",
        ingredients: Array.isArray(data?.ingredients) ? data.ingredients : [],
        steps: Array.isArray(data?.steps) ? data.steps : [],
        createdAt: new Date().toISOString(),
      };

      const nextRecipes = [newRecipe, ...recipes];
      setRecipes(nextRecipes);
      setExpandedId(newRecipe.id);
      saveStoredRecipes(nextRecipes);
    } catch (e) {
      setError(e?.message || "Failed to generate recipe");
    } finally {
      setLoading(false);
    }
  }

  function toggleExpanded(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function clearRecipeHistory() {
    setRecipes([]);
    setExpandedId(null);
    saveStoredRecipes([]);
  }

  return (
    <div className="app-page">
      <div className="app-shell">
        <div className="app-card-hero" style={{ marginBottom: 16 }}>
          <div className="app-flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 className="app-title">Recipes</h1>
              <p className="app-subtitle">
                Generate a recipe based on your selected ingredients and pantry staples.
              </p>
            </div>
            <span className="app-muted" style={{ fontSize: 13 }}>
              {user["cognito:username"]}
            </span>
          </div>
        </div>

        <div className="app-card" style={{ marginBottom: 16 }}>
          <div
            className="app-flex-between"
            style={{ gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}
          >
            <div style={{ flex: "1 1 420px", minWidth: 280 }}>
              <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800 }}>
                Available Ingredients
              </h2>

              <p className="app-muted" style={{ margin: "0 0 12px", fontSize: 14 }}>
                {ingredientCount === 0
                  ? "No ingredients available yet."
                  : `${ingredientCount} ingredient${ingredientCount === 1 ? "" : "s"} ready for recipe generation.`}
              </p>

              {ingredientCount === 0 ? (
                <div className="app-muted" style={{ fontSize: 14 }}>
                  Go to Ingredients, add or select some ingredients, then come back here.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {ingredientPreview.map((item, index) => (
                    <span
                      key={`${item.name}-${index}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: 13,
                      }}
                    >
                      {formatAvailableIngredient(item)}
                    </span>
                  ))}
                  {ingredientCount > ingredientPreview.length && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: 13,
                      }}
                    >
                      +{ingredientCount - ingredientPreview.length} more
                    </span>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minWidth: 220,
              }}
            >
              <button
                onClick={handleGenerate}
                disabled={loading || ingredientCount === 0}
                className="app-btn app-btn-primary"
              >
                {loading ? "Generating…" : "Generate Recipe"}
              </button>

              <button
                type="button"
                onClick={clearRecipeHistory}
                disabled={recipes.length === 0}
                className="app-btn"
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                }}
              >
                Clear Recipe History
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="app-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {recipes.length === 0 ? (
          <div className="app-card">
            <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800 }}>
              No recipes yet
            </h2>
            <p className="app-muted" style={{ margin: 0, fontSize: 14 }}>
              Generate your first recipe and it will show up here as an expandable card.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {recipes.map((recipe) => {
              const expanded = expandedId === recipe.id;

              return (
                <div
                  key={recipe.id}
                  className="app-card"
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.15s ease",
                  }}
                  onClick={() => toggleExpanded(recipe.id)}
                >
                  <div
                    className="app-flex-between"
                    style={{ gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}
                  >
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <h2
                        style={{
                          margin: "0 0 8px",
                          fontSize: 20,
                          fontWeight: 800,
                        }}
                      >
                        {recipe.title}
                      </h2>

                      <p
                        className="app-muted"
                        style={{
                          margin: "0 0 10px",
                          fontSize: 14,
                          lineHeight: 1.5,
                        }}
                      >
                        {recipe.summary}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          fontSize: 13,
                          opacity: 0.8,
                        }}
                      >
                        <span>{recipe.ingredients.length} ingredients</span>
                        <span>•</span>
                        <span>{recipe.steps.length} steps</span>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        opacity: 0.8,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {expanded ? "Collapse" : "Expand"}
                    </div>
                  </div>

                  {expanded && (
                    <div style={{ marginTop: 18 }}>
                      <div style={{ marginBottom: 18 }}>
                        <h3
                          style={{
                            margin: "0 0 10px",
                            fontSize: 14,
                            fontWeight: 800,
                            opacity: 0.85,
                          }}
                        >
                          Ingredients
                        </h3>

                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {recipe.ingredients.map((ing, index) => {
                            const name =
                              typeof ing === "string"
                                ? ing
                                : normalizeString(ing?.name);
                            const quantity =
                              typeof ing === "string"
                                ? ""
                                : normalizeString(ing?.quantity);

                            return (
                              <li
                                key={`${recipe.id}-ingredient-${index}`}
                                style={{ marginBottom: 6, fontSize: 14 }}
                              >
                                {quantity ? `${quantity} ${name}` : name}
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div>
                        <h3
                          style={{
                            margin: "0 0 10px",
                            fontSize: 14,
                            fontWeight: 800,
                            opacity: 0.85,
                          }}
                        >
                          Steps
                        </h3>

                        <ol style={{ margin: 0, paddingLeft: 18 }}>
                          {recipe.steps.map((step, index) => (
                            <li
                              key={`${recipe.id}-step-${index}`}
                              style={{ marginBottom: 8, fontSize: 14, lineHeight: 1.55 }}
                            >
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}