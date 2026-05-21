// client/src/services/myListsService.js
import { apiFetch } from "./apiClient";

export async function fetchLists() {
  const data = await apiFetch("/api/lists");
  return data.items || [];
}

// Create List from AI Chat Bot
export async function createListFromAI(title, items) {
  // items should be like: [{ name, qty, unit, category }]
  return apiFetch("/api/lists", {
    method: "POST",
    body: JSON.stringify({
      title,
      items,
      source: "ai",
    }),
  });
}

// Create List From Ingredients Page
export async function createListFromIngredients(title, items) {
  return apiFetch("/api/lists", {
    method: "POST",
    body: JSON.stringify({
      title,
      items,
      source: "ingredients",
    }),
  });
}

// Update List
export async function updateList(id, payload) {
  return apiFetch(`/api/lists/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Rename List
export async function renameList(id, title) {
  return updateList(id, { title });
}

// Delete List
export async function deleteList(id) {
  return apiFetch(`/api/lists/${id}`, { method: "DELETE" });
}
