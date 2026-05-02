// server/src/routes/recipes.js
import express from "express";
import OpenAI from "openai";

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normalizeString(v) {
  return String(v || "").trim();
}

function sanitizeIngredients(input) {
  const arr = Array.isArray(input) ? input : [];

  return arr
    .map((item) => ({
      name: normalizeString(item?.name),
      qty: item?.qty ?? null,
      unit: normalizeString(item?.unit) || null,
    }))
    .filter((item) => item.name);
}

function buildIngredientText(ingredients) {
  return ingredients
    .map((item) => {
      if (item.qty != null && item.unit) {
        return `- ${item.name}: ${item.qty} ${item.unit}`;
      }
      if (item.qty != null) {
        return `- ${item.name}: ${item.qty}`;
      }
      return `- ${item.name}`;
    })
    .join("\n");
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function validateRecipeShape(recipe) {
  if (!recipe || typeof recipe !== "object") return false;
  if (!normalizeString(recipe.title)) return false;
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return false;
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) return false;
  return true;
}

router.post("/generate", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ message: "Missing OPENAI_API_KEY in server environment" });
    }

    const ingredients = sanitizeIngredients(req.body?.ingredients);

    if (ingredients.length === 0) {
      return res.status(400).json({ message: "At least one ingredient is required" });
    }

    const ingredientText = buildIngredientText(ingredients);

    const prompt = `
You are generating a simple home-cooking recipe for a food app.

Use the provided ingredients as the main available ingredients.
You may assume basic pantry items only when necessary, but prefer the provided ingredients.
Return only valid JSON with this exact shape:

{
  "title": "Recipe title",
  "summary": "One short summary sentence",
  "ingredients": [
    { "name": "ingredient name", "quantity": "amount" }
  ],
  "steps": [
    "Step one",
    "Step two"
  ]
}

Rules:
- Do not include markdown
- Do not include code fences
- Do not include any text outside the JSON
- Keep the recipe realistic and concise
- Include at least 4 ingredients if possible
- Include 3 to 7 steps
- Quantities should be human readable strings like "1 cup" or "2 tbsp"

Available ingredients:
${ingredientText}
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a recipe generator that returns only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

    const text = completion.choices?.[0]?.message?.content || "";
    const parsed = safeParseJson(text);

    if (!validateRecipeShape(parsed)) {
      console.error("OPENAI RECIPE PARSE ERROR: invalid response shape");
      console.error(text);
      return res.status(502).json({ message: "Recipe generation returned an invalid response" });
    }

    const normalizedRecipe = {
      title: normalizeString(parsed.title),
      summary: normalizeString(parsed.summary),
      ingredients: parsed.ingredients
        .map((item) => ({
          name: normalizeString(item?.name),
          quantity: normalizeString(item?.quantity),
        }))
        .filter((item) => item.name),
      steps: parsed.steps.map((step) => normalizeString(step)).filter(Boolean),
    };

    return res.json(normalizedRecipe);
  } catch (err) {
    console.error("RECIPE GENERATION ERROR:", err?.message);
    console.error(err?.stack);
    return res.status(500).json({ message: err?.message || "Recipe generation failed" });
  }
});

export default router;