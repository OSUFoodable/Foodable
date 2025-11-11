import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

import Recipe from "./models/Recipe.js";

// simple health routes
app.get("/api/health", (_req, res) => {
	res.json({ ok: true, service: "api", ts: new Date().toISOString() });
});

app.get("/api/ping", (_req, res) => {
	res.send("pong");
});

app.get("/api/recipes", async (req, res) => {
	const recipes = await Recipe.find({});
	res.json(recipes);
});

app.post("/api/recipes", async (req, res) => {
	const newRecipe = new Recipe(req.body);
	const savedRecipe = await newRecipe.save();
	res.json(savedRecipe);
});

app.get("/api/recipes/:id", async (req, res) => {
	const recipe = await Recipe.findById(req.params.id);
	res.json(recipe);
});

app.put("/api/recipes/:id", async (req, res) => {
	const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
	});
	res.json(updatedRecipe);
});

app.delete("/api/recipes/:id", async (req, res) => {
	await Recipe.findByIdAndDelete(req.params.id);
	res.json({ message: "Recipe deleted successfully" });
});

const PORT = process.env.PORT || 5000;
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
