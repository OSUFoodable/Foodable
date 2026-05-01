// client/src/services/myListsService.js
import { apiFetch } from "./apiClient";

export async function fetchLists() {
  const data = await apiFetch("/api/lists");
  return data.items || [];
}

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

export async function deleteList(id) {
  return apiFetch(`/api/lists/${id}`, { method: "DELETE" });
}
