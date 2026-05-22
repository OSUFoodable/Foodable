// client/src/services/aiChatService.js
import { apiFetch } from "./apiClient";

export async function sendChatMessage(messages, dietPrefs) {
  return apiFetch("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages, dietPrefs }),
  });
  // returns { reply, groceryList? }
}