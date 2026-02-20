// src/services/ingredientsService.js

import { apiFetch } from "./apiClient";

// Fetch all ingredients for the current user
export async function listIngredients() {
  return apiFetch("/api/ingredients");
}

// Add a new ingredient
export async function addIngredient(payload) {
  return apiFetch("/api/ingredients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Update an ingredient
export async function updateIngredient(id, payload) {
  return apiFetch(`/api/ingredients/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Delete an ingredient
export async function deleteIngredient(id) {
  return apiFetch(`/api/ingredients/${id}`, {
    method: "DELETE",
  });
}