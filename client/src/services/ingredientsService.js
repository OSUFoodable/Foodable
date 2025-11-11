// src/services/ingredientsService.js

import { apiFetch } from './apiClient';

// Fetch all ingredients for the current user
export async function listIngredients() {
  return apiFetch('/ingredients');
}

// Add a new ingredient
export async function addIngredient(payload) {
  return apiFetch('/ingredients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
