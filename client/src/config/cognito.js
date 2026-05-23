// Cognito Hosted UI: Authorization Code + PKCE flow.
//
// Update client/.env when the User Pool, App Client, or domain changes.
// The App Client MUST be configured as a public client (no client secret) for
// this in-browser exchange to work; in the AWS console under "App client",
// "Client secret" should be unset.

const domain = import.meta.env.VITE_COGNITO_DOMAIN;
const region = import.meta.env.VITE_COGNITO_REGION;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI;
const scopesRaw = import.meta.env.VITE_COGNITO_SCOPES || "email+openid+phone";

if (!domain || !region || !clientId || !redirectUri) {
	console.warn(
		"[cognito] Missing one or more VITE_COGNITO_* env vars; the login flow will not work.",
	);
}

// const AUTH_BASE = `https://${domain}.auth.${region}.amazoncognito.com`;
const AUTH_BASE = "https://auth.osufoodable.app";
const PKCE_VERIFIER_KEY = "pkce_verifier";
const PKCE_STATE_KEY = "pkce_state";

// scopes can be configured as `email+openid+phone` or `email openid phone`;
// normalize to space-separated so URLSearchParams encodes spaces consistently.
const scopesNormalized = scopesRaw.replace(/\+/g, " ").trim();

// RFC 4648 §5 base64url encoding without padding.
function base64UrlEncode(bytes) {
	let str = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		str += String.fromCharCode(bytes[i]);
	}
	return btoa(str).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function randomBase64Url(byteLength = 32) {
	const bytes = new Uint8Array(byteLength);
	crypto.getRandomValues(bytes);
	return base64UrlEncode(bytes);
}

async function sha256Base64Url(input) {
	const data = new TextEncoder().encode(input);
	const hash = await crypto.subtle.digest("SHA-256", data);
	return base64UrlEncode(new Uint8Array(hash));
}

// Kick off Hosted UI sign-in. Generates a PKCE pair + state, stashes the
// verifier and state in sessionStorage, then redirects to Cognito.
export async function startLogin() {
	const verifier = randomBase64Url(32);
	const challenge = await sha256Base64Url(verifier);
	const state = randomBase64Url(16);

	sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
	sessionStorage.setItem(PKCE_STATE_KEY, state);

	const params = new URLSearchParams({
		client_id: clientId,
		response_type: "code",
		scope: scopesNormalized,
		redirect_uri: redirectUri,
		code_challenge: challenge,
		code_challenge_method: "S256",
		state,
	});

	window.location.href = `${AUTH_BASE}/login?${params.toString()}`;
}

// Exchange the one-time authorization code for tokens. We delegate the actual
// /oauth2/token call to our backend (server/src/routes/auth.js → /api/auth/exchange)
// because the App Client has a client secret that must not live in browser code.
// PKCE still applies end-to-end: the verifier travels code → backend → Cognito.
export async function exchangeCodeForTokens(code) {
	const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
	if (!verifier) {
		throw new Error("Missing PKCE verifier — start the login flow again.");
	}

	const apiBase = import.meta.env.VITE_API_URL || "";
	const res = await fetch(`${apiBase}/api/auth/exchange`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			code,
			codeVerifier: verifier,
			redirectUri,
		}),
	});

	if (!res.ok) {
		let detail = "";
		try {
			const data = await res.json();
			detail = data?.error?.message || data?.error || "";
		} catch {
			// Body wasn't JSON; fall through with empty detail.
		}
		throw new Error(
			`Token exchange failed (${res.status})${detail ? `: ${detail}` : ""}`,
		);
	}

	sessionStorage.removeItem(PKCE_VERIFIER_KEY);
	return res.json(); // { id_token, access_token, refresh_token, expires_in, token_type }
}

// Read and clear the state we set before the redirect, for CSRF comparison.
export function consumeStoredState() {
	const stored = sessionStorage.getItem(PKCE_STATE_KEY);
	sessionStorage.removeItem(PKCE_STATE_KEY);
	return stored;
}
