// server/src/app.js
// Express app construction only. No Mongo connect, no listen.
// Imported by index.js for the running server, and by tests for Supertest.

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

import foodsRouter from "./routes/foods.js";
import authRouter from "./routes/auth.js";
import requireAuth from "./middleware/requireAuth.js";

import GroceryList from "./models/GroceryList.js";
import Recipe from "./models/Recipe.js";
import Ingredient from "./models/Ingredient.js";
import User from "./models/User.js";
import SavedRecipe from "./models/SavedRecipe.js";

import {
	sanitizeGroceryList,
	toNumberOrNull,
} from "./utils/sanitizeGroceryList.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = process.env.OPENAI_API_KEY
	? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
	: null;

const app = express();

const isProd = process.env.NODE_ENV === "prod";

app.use(
	cors({
		origin: isProd ? false : "http://localhost:5173",
		credentials: true,
	}),
);

app.use(express.json());

app.use("/api/foods", foodsRouter);
app.use("/api/auth", authRouter);

// simple health routes
app.get("/api/health", (_req, res) => {
	res.json({ ok: true, service: "api", ts: new Date().toISOString() });
});

app.get("/api/ping", (_req, res) => {
	res.send("pong");
});

// ---- AI Chat ----
app.post("/api/ai/chat", requireAuth, async (req, res) => {
	try {
		if (!openai) {
			return res
				.status(503)
				.json({
					error: { message: "AI service not configured on server" },
				});
		}

		const { messages, dietPrefs: bodyDietPrefs } = req.body;

		if (!Array.isArray(messages)) {
			return res
				.status(400)
				.json({ error: { message: "messages must be an array" } });
		}

		function resolveDiet(prefs) {
			if (!prefs) return "no restrictions (omnivore)";
			if (prefs.vegan) return "vegan";
			if (prefs.vegetarian) return "vegetarian";
			if (prefs.pescatarian) return "pescatarian";
			return "no restrictions (omnivore)";
		}

		const userDoc = await User.findById(req.user.sub).lean();
		const diet = resolveDiet(userDoc?.dietPrefs || bodyDietPrefs);

		const systemPrompt = `
You are Foodable's grocery list assistant.

Diet setting from the user's profile: ${diet}

CRITICAL RULE:
You MUST strictly follow the user's diet. Never include foods that violate it.

- If vegetarian: NEVER include meat or fish.
- If vegan: NEVER include meat, fish, dairy, eggs, or honey.
- If pescatarian: NEVER include poultry or red meat.
- If no restrictions: anything is allowed.

If a user asks for something that conflicts with their diet (like "high protein"),
you must adapt using foods that still respect the diet.

Do NOT suggest foods outside the diet under any circumstances.

If the user asks for low-calorie, prioritize foods that are typically low calorie.
If the user asks for high-protein, prioritize foods that are typically high in protein.

Return STRICT JSON ONLY with this exact shape:
{
  "reply": "Short grocery list + short meal ideas",
  "groceryList": [
    { "name": "Chicken breast", "qty": 200, "unit": "g", "category": "protein" }
  ]
}

Requirements:
- groceryList must be an array
- qty must be a number (no units inside qty)
- unit must be a short string ("g", "oz", "count", "cup", etc.)
- category can be: protein | carbs | veggies | fruit | dairy | pantry | other
- No markdown, no backticks, no extra text outside the JSON.
`;

		const response = await openai.responses.create({
			model: "gpt-4.1-mini",
			input: [{ role: "system", content: systemPrompt }, ...messages],
		});

		const text = response.output_text || "";

		try {
			const parsed = JSON.parse(text);

			const reply =
				typeof parsed?.reply === "string"
					? parsed.reply
					: typeof text === "string"
						? text
						: "";

			const groceryList = sanitizeGroceryList(parsed?.groceryList);

			return res.json({
				reply,
				groceryList: groceryList.length ? groceryList : null,
			});
		} catch {
			return res.json({ reply: text, groceryList: null });
		}
	} catch (err) {
		console.error("AI error:", err);
		res.status(500).json({ error: { message: "AI request failed" } });
	}
});

// ---- Grocery Lists CRUD ----

app.get("/api/lists", requireAuth, async (req, res) => {
	try {
		const lists = await GroceryList.find({ userId: req.user.sub }).sort({
			createdAt: -1,
		});
		res.json({ items: lists });
	} catch (err) {
		res.status(500).json({ error: { message: err.message } });
	}
});

app.post("/api/lists", requireAuth, async (req, res) => {
	try {
		const { title, items } = req.body;

		const cleanItems = sanitizeGroceryList(items);
		if (cleanItems.length === 0) {
			return res
				.status(400)
				.json({
					error: { message: "items must be a non-empty array" },
				});
		}

		const list = new GroceryList({
			userId: req.user.sub,
			title: (title || "").toString().trim() || "Grocery List",
			items: cleanItems,
		});

		const saved = await list.save();
		res.status(201).json(saved);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.put("/api/lists/:id", requireAuth, async (req, res) => {
	try {
		const updates = {};

		if (req.body.title !== undefined) {
			const title = (req.body.title || "").toString().trim();

			if (!title) {
				return res
					.status(400)
					.json({ error: { message: "title is required" } });
			}

			updates.title = title;
		}

		if (req.body.items !== undefined) {
			const cleanItems = sanitizeGroceryList(req.body.items);

			if (cleanItems.length === 0) {
				return res
					.status(400)
					.json({
						error: { message: "items must be a non-empty array" },
					});
			}

			updates.items = cleanItems;
		}

		if (Object.keys(updates).length === 0) {
			return res
				.status(400)
				.json({ error: { message: "No updates provided" } });
		}

		const updated = await GroceryList.findOneAndUpdate(
			{ _id: req.params.id, userId: req.user.sub },
			updates,
			{
				new: true,
				runValidators: true,
			},
		);

		if (!updated) {
			return res
				.status(404)
				.json({ error: { message: "List not found" } });
		}

		res.json(updated);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.delete("/api/lists/:id", requireAuth, async (req, res) => {
	try {
		const deleted = await GroceryList.findOneAndDelete({
			_id: req.params.id,
			userId: req.user.sub,
		});
		if (!deleted) {
			return res
				.status(404)
				.json({ error: { message: "List not found" } });
		}
		res.json({ message: "List deleted successfully" });
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

// ---- Recipe CRUD ----

app.get("/api/recipes", requireAuth, async (req, res) => {
	try {
		const recipes = await Recipe.find({ userId: req.user.sub });
		res.json(recipes);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.post("/api/recipes/generate", requireAuth, async (req, res) => {
	try {
		if (!openai) {
			return res
				.status(503)
				.json({
					error: { message: "AI service not configured on server" },
				});
		}

		const systemPrompt = `
You are Foodable's recipe generator.

Return STRICT JSON ONLY with this exact shape:
{
  "title": "Recipe name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": ["step 1", "step 2"],
  "nutrition": {
    "calories": 650,
    "protein": 45,
    "carbs": 70,
    "fat": 18
  }
}

Rules:
- calories, protein, carbs, and fat MUST be numbers only with no units.
- calories should be estimated total calories for the full recipe.
- protein, carbs, and fat should be estimated grams for the full recipe.
- ingredients must be simple strings.
- steps must be simple strings.
- keep the recipe realistic, clear, and simple.
- use common ingredients.
- nutrition values should be reasonable estimates.
- Do NOT include markdown, backticks, or extra text outside the JSON.
`;

		const response = await openai.responses.create({
			model: "gpt-4.1-mini",
			input: [{ role: "system", content: systemPrompt }],
		});

		const text = response.output_text || "";

		try {
			const parsed = JSON.parse(text);

			const recipe = {
				title: parsed?.title || "Generated Recipe",
				ingredients: Array.isArray(parsed?.ingredients)
					? parsed.ingredients
					: [],
				steps: Array.isArray(parsed?.steps) ? parsed.steps : [],
				nutrition: {
					calories: toNumberOrNull(parsed?.nutrition?.calories),
					protein: toNumberOrNull(parsed?.nutrition?.protein),
					carbs: toNumberOrNull(parsed?.nutrition?.carbs),
					fat: toNumberOrNull(parsed?.nutrition?.fat),
				},
			};

			return res.json(recipe);
		} catch {
			return res
				.status(500)
				.json({
					error: { message: "Failed to parse AI recipe response" },
				});
		}
	} catch (err) {
		console.error("Recipe AI error:", err);
		res.status(500).json({
			error: { message: "Recipe generation failed" },
		});
	}
});

app.post("/api/recipes", requireAuth, async (req, res) => {
	try {
		const { userId: _ignoreClientUserId, ...rest } = req.body || {};
		const newRecipe = new Recipe({ ...rest, userId: req.user.sub });
		const savedRecipe = await newRecipe.save();
		res.status(201).json(savedRecipe);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.get("/api/recipes/:id", requireAuth, async (req, res) => {
	try {
		const recipe = await Recipe.findOne({
			_id: req.params.id,
			userId: req.user.sub,
		});
		if (!recipe)
			return res
				.status(404)
				.json({ error: { message: "Recipe not found" } });
		res.json(recipe);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.put("/api/recipes/:id", requireAuth, async (req, res) => {
	try {
		const { userId: _ignoreClientUserId, ...rest } = req.body || {};
		const updatedRecipe = await Recipe.findOneAndUpdate(
			{ _id: req.params.id, userId: req.user.sub },
			rest,
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

app.delete("/api/recipes/:id", requireAuth, async (req, res) => {
	try {
		const deleted = await Recipe.findOneAndDelete({
			_id: req.params.id,
			userId: req.user.sub,
		});
		if (!deleted)
			return res
				.status(404)
				.json({ error: { message: "Recipe not found" } });
		res.json({ message: "Recipe deleted successfully" });
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

// ---- Saved Recipe CRUD ----

app.get("/api/saved-recipes", requireAuth, async (req, res) => {
	try {
		const savedRecipes = await SavedRecipe.find({
			userId: req.user.sub,
		}).sort({
			createdAt: -1,
		});
		res.json({ items: savedRecipes });
	} catch (err) {
		res.status(500).json({ error: { message: err.message } });
	}
});

app.post("/api/saved-recipes", requireAuth, async (req, res) => {
	try {
		const { recipeId, name, ingredients, instructions, nutrition } =
			req.body;

		const cleanName = (name || "").toString().trim();

		if (!cleanName) {
			return res
				.status(400)
				.json({ error: { message: "name is required" } });
		}

		if (!Array.isArray(ingredients) || ingredients.length === 0) {
			return res
				.status(400)
				.json({
					error: { message: "ingredients must be a non-empty array" },
				});
		}

		const existing = await SavedRecipe.findOne({
			userId: req.user.sub,
			recipeId: recipeId || null,
			name: cleanName,
		});

		if (existing) {
			return res.status(200).json(existing);
		}

		const savedRecipe = new SavedRecipe({
			userId: req.user.sub,
			recipeId: recipeId || null,
			name: cleanName,
			ingredients,
			instructions: (instructions || "").toString().trim(),
			nutrition: nutrition || {},
		});

		const saved = await savedRecipe.save();
		res.status(201).json(saved);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.delete("/api/saved-recipes/:id", requireAuth, async (req, res) => {
	try {
		const deleted = await SavedRecipe.findOneAndDelete({
			_id: req.params.id,
			userId: req.user.sub,
		});

		if (!deleted) {
			return res
				.status(404)
				.json({ error: { message: "Saved recipe not found" } });
		}

		res.json({ message: "Saved recipe deleted successfully" });
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

// ---- Ingredient CRUD ----

app.get("/api/ingredients", requireAuth, async (req, res) => {
	try {
		const ingredients = await Ingredient.find({ userId: req.user.sub });
		res.json({ items: ingredients });
	} catch (err) {
		res.status(500).json({ error: { message: err.message } });
	}
});

app.post("/api/ingredients", requireAuth, async (req, res) => {
	try {
		const { userId: _ignoreClientUserId, ...rest } = req.body || {};
		const newIngredient = new Ingredient({ ...rest, userId: req.user.sub });
		const saved = await newIngredient.save();
		res.status(201).json(saved);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.get("/api/ingredients/:id", requireAuth, async (req, res) => {
	try {
		const ingredient = await Ingredient.findOne({
			_id: req.params.id,
			userId: req.user.sub,
		});
		if (!ingredient)
			return res
				.status(404)
				.json({ error: { message: "Ingredient not found" } });
		res.json(ingredient);
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

app.put("/api/ingredients/:id", requireAuth, async (req, res) => {
	try {
		const { userId: _ignoreClientUserId, ...rest } = req.body || {};
		const updated = await Ingredient.findOneAndUpdate(
			{ _id: req.params.id, userId: req.user.sub },
			rest,
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

app.delete("/api/ingredients/:id", requireAuth, async (req, res) => {
	try {
		const deleted = await Ingredient.findOneAndDelete({
			_id: req.params.id,
			userId: req.user.sub,
		});
		if (!deleted)
			return res
				.status(404)
				.json({ error: { message: "Ingredient not found" } });
		res.json({ message: "Ingredient deleted successfully" });
	} catch (err) {
		res.status(400).json({ error: { message: err.message } });
	}
});

// Serve React client in production
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get(/.*/, (_req, res) => {
	res.sendFile(path.join(clientDist, "index.html"));
});

export default app;
