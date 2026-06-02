// server/src/index.js
// Load .env before any other module reads process.env (cognitoVerifier needs it
// at module-init time, and ES module imports are hoisted above top-level code).
import "dotenv/config";

import mongoose from "mongoose";
import app from "./app.js";

console.log("USDA_API_KEY loaded?", Boolean(process.env.USDA_API_KEY));
console.log("OPENAI_API_KEY loaded?", Boolean(process.env.OPENAI_API_KEY));

const PORT = process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
	try {
		if (MONGODB_URI) {
			await mongoose.connect(MONGODB_URI);
			console.log("Mongo connected");
		} else {
			console.warn("No MONGODB_URI set, starting API without DB");
		}

		app.listen(PORT, () => {
			console.log(`API listening on http://localhost:${PORT}`);
		});
	} catch (err) {
		console.error("Startup error", err);
		process.exit(1);
	}
}

start();
