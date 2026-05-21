// client/src/services/savedRecipesService.js

import { apiFetch } from "./apiClient";

export async function getSavedRecipes(userEmail) {
  return apiFetch(`/api/saved-recipes?userEmail=${encodeURIComponent(userEmail)}`);
}

export async function saveRecipe(payload) {
  return apiFetch("/api/saved-recipes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteSavedRecipe(id) {
  return apiFetch(`/api/saved-recipes/${id}`, {
    method: "DELETE",
  });
}