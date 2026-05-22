// src/services/apiClient.js

const BASE_URL = import.meta.env.VITE_API_URL || "";

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  // Attach Cognito access token (if present)
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // credentials: 'omit' prevents the browser from auto-attaching cached
  // basicauth (used by Caddy to gate the dev SPA shell) onto API requests,
  // which Safari otherwise sends in addition to — and sometimes instead of —
  // our explicit Bearer token.
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "omit",
  });

  if (!res.ok) {
    let msg = `Request failed ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error?.message || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return res.json();
}