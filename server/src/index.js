import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import foodsRouter from "./routes/foods.js";

dotenv.config();

console.log("USDA_API_KEY loaded?", Boolean(process.env.USDA_API_KEY));

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/foods", foodsRouter); // Discover Foods

import Recipe from "./models/Recipe.js";
import Ingredient from "./models/Ingredient.js";

// simple health routes
app.get("/api/health", (_req, res) => {
	res.json({ ok: true, service: "api", ts: new Date().toISOString() });
});

app.get("/api/ping", (_req, res) => {
	res.send("pong");
});

// ---- Recipe CRUD ----

app.get("/api/recipes", async (_req, res) => {
	try {
		const recipes = await Recipe.find({});
		res.json(recipes);
	} catch (err) {
		res.status(500).json({ error: { message: err.message } });
	}
});

app.post("/api/recipes", async (req, res) => {
	try {
		const newRecipe = new Recipe(req.body);
		const savedRecipe = await newRecipe.save();
		res.status(201).json(savedRecipe);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.get("/api/recipes/:id", async (req, res) => {
	try {
		const recipe = await Recipe.findById(req.params.id);
		if (!recipe)
			return res
				.status(404)
				.json({ error: { message: "Recipe not found" } });
		res.json(recipe);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.put("/api/recipes/:id", async (req, res) => {
	try {
		const updatedRecipe = await Recipe.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			},
		);
		if (!updatedRecipe)
			return res
				.status(404)
				.json({ error: { message: "Recipe not found" } });
		res.json(updatedRecipe);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.delete("/api/recipes/:id", async (req, res) => {
	try {
		const deleted = await Recipe.findByIdAndDelete(req.params.id);
		if (!deleted)
			return res
				.status(404)
				.json({ error: { message: "Recipe not found" } });
		res.json({ message: "Recipe deleted successfully" });
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

// ---- Ingredient CRUD ----

app.get("/api/ingredients", async (_req, res) => {
	try {
		const ingredients = await Ingredient.find({});
		res.json({ items: ingredients });
	} catch (err) {
		res.status(500).json({ error: { message: err.message } });
	}
});

app.post("/api/ingredients", async (req, res) => {
	try {
		const newIngredient = new Ingredient(req.body);
		const saved = await newIngredient.save();
		res.status(201).json(saved);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.get("/api/ingredients/:id", async (req, res) => {
	try {
		const ingredient = await Ingredient.findById(req.params.id);
		if (!ingredient)
			return res
				.status(404)
				.json({ error: { message: "Ingredient not found" } });
		res.json(ingredient);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.put("/api/ingredients/:id", async (req, res) => {
	try {
		const updated = await Ingredient.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			},
		);
		if (!updated)
			return res
				.status(404)
				.json({ error: { message: "Ingredient not found" } });
		res.json(updated);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.delete("/api/ingredients/:id", async (req, res) => {
	try {
		const deleted = await Ingredient.findByIdAndDelete(req.params.id);
		if (!deleted)
			return res
				.status(404)
				.json({ error: { message: "Ingredient not found" } });
		res.json({ message: "Ingredient deleted successfully" });
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

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
