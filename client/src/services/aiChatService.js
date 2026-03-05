// client/src/services/aiChatService.js
export async function sendChatMessage(messages, dietPrefs) {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ messages, dietPrefs }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "AI request failed");
  }

  // IMPORTANT: return full object (not just reply string)
  return res.json(); // { reply, groceryList? }
}