// server/src/index.js
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import foodsRouter from "./routes/foods.js";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import GroceryList from "./models/GroceryList.js";
import Recipe from "./models/Recipe.js";
import Ingredient from "./models/Ingredient.js";

dotenv.config();

// IMPORTANT: don't crash if key missing
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

console.log("USDA_API_KEY loaded?", Boolean(process.env.USDA_API_KEY));
console.log("OPENAI_API_KEY loaded?", Boolean(process.env.OPENAI_API_KEY));

const app = express();

const isProd = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: isProd ? false : "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/foods", foodsRouter); // Discover Foods

// simple health routes
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "api", ts: new Date().toISOString() });
});

app.get("/api/ping", (_req, res) => {
  res.send("pong");
});

/* ---------------------------
   Helpers for AI list cleanup
---------------------------- */
const ALLOWED_CATEGORIES = new Set([
  "protein",
  "carbs",
  "veggies",
  "fruit",
  "dairy",
  "pantry",
  "other",
]);

function toNumberOrNull(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;

  // If AI sends "200g" or "1.5" as a string, try to extract a number
  if (typeof v === "string") {
    const m = v.match(/-?\d+(\.\d+)?/);
    if (m) {
      const n = Number(m[0]);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function normalizeUnit(v) {
  const unit = (v ?? "").toString().trim();
  if (!unit) return "count";
  // keep it short
  return unit.slice(0, 20);
}

function normalizeCategory(v) {
  const cat = (v ?? "").toString().trim().toLowerCase();
  return ALLOWED_CATEGORIES.has(cat) ? cat : "other";
}

function sanitizeGroceryList(list) {
  if (!Array.isArray(list)) return [];

  const clean = list
    .map((it) => {
      const name = (it?.name ?? "").toString().trim();
      if (!name) return null;

      const qty = toNumberOrNull(it?.qty);
      const unit = normalizeUnit(it?.unit);
      const category = normalizeCategory(it?.category);

      return {
        name,
        qty: qty ?? 1, // fallback so it matches your schema (Number)
        unit,
        category,
      };
    })
    .filter(Boolean);

  // cap size so nobody saves a crazy list
  return clean.slice(0, 60);
}

// ---- AI Chat ----
app.post("/api/ai/chat", async (req, res) => {
  try {
    if (!openai) {
      // keep server alive; just return a friendly error
      return res
        .status(503)
        .json({ error: { message: "AI service not configured on server" } });
    }

    const { messages, dietPrefs } = req.body;

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

    const diet = resolveDiet(dietPrefs);

    // IMPORTANT: Return structured JSON so the client can "Save to My Lists"
    const systemPrompt = `
You are Foodable's grocery list assistant.

Diet setting from the user's profile: ${diet}

Rules:
- vegan: no meat, fish, eggs, dairy, honey
- vegetarian: no meat or fish (dairy/eggs ok)
- pescatarian: seafood ok, no poultry or red meat
- no restrictions: anything ok

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

    // Try to parse JSON. If it fails, fall back to plain reply.
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

// Get lists for a user: /api/lists?owner=dev-user
app.get("/api/lists", async (req, res) => {
  try {
    const owner = (req.query.owner || "").toString().trim();
    if (!owner) {
      return res.status(400).json({ error: { message: "owner is required" } });
    }

    const lists = await GroceryList.find({ owner }).sort({ createdAt: -1 });
    res.json({ items: lists });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// Create a list
app.post("/api/lists", async (req, res) => {
  try {
    const { owner, title, items } = req.body;

    const ownerStr = (owner || "").toString().trim();
    if (!ownerStr) {
      return res.status(400).json({ error: { message: "owner is required" } });
    }

    const cleanItems = sanitizeGroceryList(items);
    if (cleanItems.length === 0) {
      return res
        .status(400)
        .json({ error: { message: "items must be a non-empty array" } });
    }

    const list = new GroceryList({
      owner: ownerStr,
      title: (title || "").toString().trim() || "Grocery List",
      items: cleanItems,
    });

    const saved = await list.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
});

// Delete a list
app.delete("/api/lists/:id", async (req, res) => {
  try {
    const deleted = await GroceryList.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: { message: "List not found" } });
    }
    res.json({ message: "List deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
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
      return res.status(404).json({ error: { message: "Recipe not found" } });
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
      return res.status(404).json({ error: { message: "Recipe not found" } });
    res.json(updatedRecipe);
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
});

app.delete("/api/recipes/:id", async (req, res) => {
  try {
    const deleted = await Recipe.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ error: { message: "Recipe not found" } });
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

// Serve React client in production
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
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