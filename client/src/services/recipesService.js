// src/services/recipesService.js

import { apiFetch } from './apiClient';

export async function getRecipes() {
  return apiFetch('/api/recipes');
}

export async function generateRecipe() {
  return apiFetch('/api/recipes/generate', { method: 'POST' });
}

export async function getRecipeById(id) {
  return apiFetch(`/api/recipes/${id}`);
}

export async function createRecipe(payload) {
  return apiFetch('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRecipe(id, payload) {
  return apiFetch(`/api/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteRecipe(id) {
  return apiFetch(`/api/recipes/${id}`, {
    method: 'DELETE',
  });
}
