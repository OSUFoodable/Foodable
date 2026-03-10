// src/utils/recipeStorage.js

const RECIPES_KEY = "foodable_generated_recipes_v1";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function getStoredRecipes() {
  return readJson(RECIPES_KEY, []);
}

export function saveStoredRecipes(recipes) {
  localStorage.setItem(RECIPES_KEY, JSON.stringify(Array.isArray(recipes) ? recipes : []));
}

export function prependStoredRecipe(recipe) {
  const current = getStoredRecipes();
  const next = [recipe, ...current];
  saveStoredRecipes(next);
  return next;
}

export function clearStoredRecipes() {
  localStorage.removeItem(RECIPES_KEY);
}