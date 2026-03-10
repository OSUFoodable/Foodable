// src/services/localIngredientsService.js

const INGREDIENTS_KEY = "foodable_ingredients_v1";

function readIngredients() {
  try {
    const raw = localStorage.getItem(INGREDIENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIngredients(items) {
  localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(items));
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ing_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function normalizeIngredient(payload = {}) {
  return {
    id: payload.id || makeId(),
    name: String(payload.name || "").trim(),
    qty: payload.qty ?? undefined,
    unit: String(payload.unit || "").trim() || undefined,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function listIngredients() {
  const items = readIngredients();
  return { items };
}

export async function addIngredient(payload) {
  const name = String(payload?.name || "").trim();
  if (!name) {
    throw new Error("Ingredient name is required");
  }

  const items = readIngredients();

  const newItem = normalizeIngredient({
    name,
    qty: payload?.qty,
    unit: payload?.unit,
  });

  items.unshift(newItem);
  writeIngredients(items);

  return newItem;
}

export async function updateIngredient(id, payload) {
  if (!id) {
    throw new Error("Ingredient id is required");
  }

  const items = readIngredients();
  const index = items.findIndex((item) => item.id === id || item._id === id);

  if (index === -1) {
    throw new Error("Ingredient not found");
  }

  const current = items[index];
  const nextName = String(payload?.name ?? current.name ?? "").trim();

  if (!nextName) {
    throw new Error("Ingredient name is required");
  }

  const updated = {
    ...current,
    name: nextName,
    qty: payload?.qty ?? undefined,
    unit: String(payload?.unit || "").trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  items[index] = updated;
  writeIngredients(items);

  return updated;
}

export async function deleteIngredient(id) {
  if (!id) {
    throw new Error("Ingredient id is required");
  }

  const items = readIngredients();
  const next = items.filter((item) => item.id !== id && item._id !== id);

  writeIngredients(next);
  return { success: true };
}