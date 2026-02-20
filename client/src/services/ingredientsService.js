// src/services/ingredientsService.js

import { apiFetch } from "./apiClient";

// Fetch all ingredients for the current user
export async function listIngredients() {
  return apiFetch("/ingredients");
}

// Add a new ingredient
export async function addIngredient(payload) {
  return apiFetch("/ingredients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Update an ingredient
export async function updateIngredient(id, payload) {
  return apiFetch(`/ingredients/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Delete an ingredient
export async function deleteIngredient(id) {
  return apiFetch(`/ingredients/${id}`, {
    method: "DELETE",
  });
}