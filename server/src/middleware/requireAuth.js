import { accessTokenVerifier } from "../auth/cognitoVerifier.js";

export default async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ error: { message: "Missing or invalid Authorization header" } });
  }

  try {
    const payload = await accessTokenVerifier.verify(token);
    req.user = {
      sub: payload.sub,
      username: payload.username,
    };
    next();
  } catch (err) {
    console.warn("[requireAuth] token verification failed:", err.message);
    res.status(401).json({ error: { message: "Unauthorized" } });
  }
}
