import express from "express";
import User from "../models/User.js";
import { idTokenVerifier } from "../auth/cognitoVerifier.js";

const router = express.Router();

// Exchange an authorization code for tokens. Holds the client secret server-side
// (which an SPA cannot safely do) and forwards the request to Cognito.
router.post("/exchange", async (req, res) => {
	const { code, codeVerifier, redirectUri } = req.body || {};
	if (!code || !codeVerifier || !redirectUri) {
		return res.status(400).json({
			error: {
				message: "code, codeVerifier, and redirectUri are required",
			},
		});
	}

	const domain = process.env.COGNITO_DOMAIN;
	const region = process.env.COGNITO_REGION;
	const clientId = process.env.COGNITO_CLIENT_ID;
	const clientSecret = process.env.COGNITO_CLIENT_SECRET;

	if (!domain || !region || !clientId || !clientSecret) {
		console.error(
			"[auth/exchange] missing one of COGNITO_DOMAIN, COGNITO_REGION, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET",
		);
		return res
			.status(500)
			.json({ error: { message: "Cognito exchange not configured" } });
	}

	const tokenUrl = `https://${domain}.auth.${region}.amazoncognito.com/oauth2/token`;
	const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
		"base64",
	);

	const body = new URLSearchParams({
		grant_type: "authorization_code",
		client_id: clientId,
		code,
		redirect_uri: redirectUri,
		code_verifier: codeVerifier,
	});

	try {
		const cognitoRes = await fetch(tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: `Basic ${basicAuth}`,
			},
			body: body.toString(),
		});

		const data = await cognitoRes.json().catch(() => ({}));

		if (!cognitoRes.ok) {
			console.warn(
				"[auth/exchange] Cognito returned",
				cognitoRes.status,
				data,
			);
			return res.status(cognitoRes.status).json({
				error: {
					message:
						data.error_description ||
						data.error ||
						"Token exchange failed",
				},
			});
		}

		res.json(data);
	} catch (err) {
		console.error("[auth/exchange] request failed:", err);
		res.status(502).json({ error: { message: "Could not reach Cognito" } });
	}
});

// Verify the Cognito id_token and upsert a User record keyed by Cognito sub.
// Called by the frontend once after Hosted UI login.
router.post("/sync", async (req, res) => {
	const idToken = req.body?.idToken;
	if (!idToken) {
		return res
			.status(400)
			.json({ error: { message: "idToken is required" } });
	}

	let payload;
	try {
		payload = await idTokenVerifier.verify(idToken);
	} catch (err) {
		console.warn("[auth/sync] id_token verification failed:", err.message);
		return res.status(401).json({ error: { message: "Invalid id_token" } });
	}

	try {
		const user = await User.findByIdAndUpdate(
			payload.sub,
			{
				$set: {
					email: payload.email,
					username: payload["cognito:username"],
					lastLoginAt: new Date(),
				},
			},
			{ upsert: true, new: true, setDefaultsOnInsert: true },
		);
		res.json(user);
	} catch (err) {
		console.error("[auth/sync] upsert failed:", err);
		res.status(500).json({ error: { message: "Failed to sync user" } });
	}
});

export default router;
