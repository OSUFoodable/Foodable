import { apiFetch } from "./apiClient";

// Verifies the Cognito id_token on the backend and upserts a User record.
// Called once after Hosted UI login (or on session rehydrate).
export async function syncUser(idToken) {
  return apiFetch("/api/auth/sync", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}
