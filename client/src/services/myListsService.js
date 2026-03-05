// client/src/services/myListsService.js
import { apiFetch } from "./apiClient";

function getOwner(user) {
  return user?.["cognito:username"] || user?.username || user?.email || "guest";
}

export async function fetchLists(user) {
  const owner = getOwner(user);
  const data = await apiFetch(`/api/lists?owner=${encodeURIComponent(owner)}`);
  return data.items || [];
}

export async function createListFromAI(user, title, items) {
  const owner = getOwner(user);

  // items should be like: [{ name, qty, unit, category }]
  return apiFetch("/api/lists", {
    method: "POST",
    body: JSON.stringify({
      owner,
      title,
      items,
      source: "ai",
    }),
  });
}

export async function deleteList(id) {
  return apiFetch(`/api/lists/${id}`, { method: "DELETE" });
}