// src/utils/ingredientDraft.js

const INGREDIENTS_KEY = "foodable_ingredients_v1";
const RECIPE_DRAFT_KEY = "foodable_recipe_ingredients_draft";
const STAPLES_KEY = "foodable_ing_staples_v1";
const STAPLES_STATE_KEY = "foodable_ing_staples_state_v1";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeString(v) {
  return String(v || "").trim();
}

function safeLower(v) {
  return normalizeString(v).toLowerCase();
}

export function setRecipeDraftIngredients(items) {
  localStorage.setItem(RECIPE_DRAFT_KEY, JSON.stringify(Array.isArray(items) ? items : []));
}

export function getRecipeDraftIngredients() {
  return readJson(RECIPE_DRAFT_KEY, []);
}

export function clearRecipeDraftIngredients() {
  localStorage.removeItem(RECIPE_DRAFT_KEY);
}

export function buildAvailableIngredientsFromStorage() {
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
      unit: item?.unit,
    });
  }

  for (const staple of staples) {
    const name = normalizeString(staple);
    if (!name) continue;

    const inStock = Boolean(staplesState[safeLower(name)]);
    if (!inStock) continue;

    const key = safeLower(name);
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({ name });
  }

  return out;
}