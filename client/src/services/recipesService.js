// src/services/recipesService.js

import { apiFetch } from './apiClient';

export async function getRecipe() {
  return apiFetch('/recipe');
}
