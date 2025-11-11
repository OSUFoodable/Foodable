// src/services/apiClient.js

const BASE_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let msg = `Request failed ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return res.json();
}
