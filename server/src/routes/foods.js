// server/src/routes/foods.js
import express from "express";

const router = express.Router();

const USER_AGENT = "Foodable-CS462/1.0 (localhost)";
const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

// OpenFoodFacts (for images via UPC)
const OFF_PRODUCT_URL = "https://world.openfoodfacts.org/api/v0/product/";
const offCache = new Map(); // upc -> imageUrl|null

const OZ_TO_G = 28.349523125;

// ---------- small utilities ----------
function round0(v) {
  const num = Number(v);
  if (!Number.isFinite(num)) return null;
  return Math.round(num);
}

function round1(v) {
  const num = Number(v);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 10) / 10;
}

function clampText(s, max = 120) {
  const t = String(s || "").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function hasUsefulText(s) {
  const t = String(s || "").trim();
  if (!t) return false;
  if (t.length < 3) return false;
  if (t.toLowerCase() === "unknown") return false;
  return true;
}

function getNutrientValue(foodNutrients, predicate) {
  const arr = Array.isArray(foodNutrients) ? foodNutrients : [];
  const hit = arr.find((n) => {
    const name = String(n?.nutrientName || "").toLowerCase();
    return predicate(name);
  });
  return hit?.value ?? null;
}

function normalizeUnit(unit) {
  return String(unit || "").trim().toLowerCase();
}

// Returns BOTH grams for math + display unit (g or oz)
function servingToWeight(size, unit) {
  const s = Number(size);
  if (!Number.isFinite(s) || s <= 0) return null;

  const u = normalizeUnit(unit);

  // grams
  if (u === "g" || u === "gram" || u === "grams") {
    return { grams: s, displayAmount: s, displayUnit: "g" };
  }

  // ounces
  if (u === "oz" || u === "ounce" || u === "ounces") {
    return { grams: s * OZ_TO_G, displayAmount: s, displayUnit: "oz" };
  }

  return null; // unknown or non-weight unit
}

function scaleNutrition(nutritionPer100g, grams) {
  const factor = Number(grams) / 100;
  if (!Number.isFinite(factor) || factor <= 0) return nutritionPer100g;

  const n = nutritionPer100g || {};
  return {
    calories: n.calories == null ? null : round0(n.calories * factor),
    protein: n.protein == null ? null : round0(n.protein * factor),
    carbs: n.carbs == null ? null : round0(n.carbs * factor),
    fat: n.fat == null ? null : round0(n.fat * factor),
  };
}

// ---------- fetch helpers ----------
async function fetchJson(
  url,
  { method = "GET", headers = {}, body = null, timeoutMs = 20000, retries = 1 } = {}
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "User-Agent": USER_AGENT,
          ...headers,
        },
        body,
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `HTTP ${res.status}${text ? ` - ${text.slice(0, 120)}` : ""}`.trim()
        );
      }

      return await res.json();
    } catch (e) {
      const isAbort =
        e?.name === "AbortError" ||
        String(e?.message).toLowerCase().includes("aborted");
      if (!isAbort || attempt === retries) throw e;
    } finally {
      clearTimeout(t);
    }
  }
}

// ---------- USDA search ----------
async function usdaSearch(query) {
  const USDA_API_KEY = process.env.USDA_API_KEY;

  if (!USDA_API_KEY) {
    throw new Error("Missing USDA_API_KEY in server/.env");
  }

  const requestBody = {
    query,
    dataType: ["Branded", "Foundation", "Survey (FNDDS)"],
    pageSize: 25,
    pageNumber: 1,
  };

  const url = `${USDA_SEARCH_URL}?api_key=${encodeURIComponent(USDA_API_KEY)}`;

  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    timeoutMs: 20000,
    retries: 1,
  });
}

// ---------- OpenFoodFacts image lookup (UPC -> image URL) ----------
async function openFoodFactsImageByUpc(upc) {
  const clean = String(upc || "").trim();
  if (!clean) return null;

  if (offCache.has(clean)) return offCache.get(clean);

  try {
    const data = await fetchJson(`${OFF_PRODUCT_URL}${encodeURIComponent(clean)}.json`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeoutMs: 12000,
      retries: 0,
    });

    const img =
      data?.product?.image_front_small_url ||
      data?.product?.image_front_url ||
      data?.product?.image_url ||
      data?.product?.image_small_url ||
      data?.product?.image_thumb_url ||
      null;

    offCache.set(clean, img);
    return img;
  } catch {
    offCache.set(clean, null);
    return null;
  }
}

// Normalize USDA item
function normalizeUsdaFood(f) {
  const description = String(f?.description || "").trim();
  const brand = String(f?.brandOwner || f?.brandName || "").trim() || null;

  const nutrients = f?.foodNutrients || [];

  const calories = getNutrientValue(nutrients, (name) => name.includes("energy"));
  const protein = getNutrientValue(nutrients, (name) => name === "protein");
  const carbs = getNutrientValue(nutrients, (name) => name.includes("carbohydrate"));
  const fat = getNutrientValue(
    nutrients,
    (name) => name.includes("total lipid") || name === "fat"
  );

  const upc = String(f?.gtinUpc || "").trim() || null;

  const nutritionPer100g = {
    calories: round0(calories),
    protein: round0(protein),
    carbs: round0(carbs),
    fat: round0(fat),
  };

  // Serving data (USDA branded may include these)
  const servingSize = f?.servingSize ?? null;
  const servingSizeUnit = String(f?.servingSizeUnit || "").trim() || null;

  let nutrition = nutritionPer100g;
  let nutritionBasis = { per: "100g", amount: 100, unit: "g" };

  // use display unit (g or oz), but compute using grams
  const servingWeight = servingToWeight(servingSize, servingSizeUnit);
  if (servingWeight) {
    nutrition = scaleNutrition(nutritionPer100g, servingWeight.grams);
    nutritionBasis = {
      per: "serving",
      amount: round1(servingWeight.displayAmount),
      unit: servingWeight.displayUnit, // "g" or "oz"
    };
  }

  return {
    id: String(f?.fdcId ?? ""),
    source: "usda",
    name: clampText(description) || "Unknown",
    brand: brand ? clampText(brand, 80) : null,
    upc,
    imageUrl: null,

    nutrition,
    nutritionBasis,

    // optional (for debugging / future UI)
    servingSize: servingSize == null ? null : round1(servingSize),
    servingUnit: servingSizeUnit,
    servingGrams: servingWeight ? round1(servingWeight.grams) : null,
  };
}

function hasAnyNutritionItem(it) {
  const n = it?.nutrition || {};
  const vals = [n.calories, n.protein, n.carbs, n.fat];
  const anyReal = vals.some((v) => v !== null && v !== undefined);
  const allZero = vals.every((v) => v === 0);
  return anyReal && !allZero;
}

// ---------- route ----------
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ items: [] });

    const data = await usdaSearch(q);
    const foods = Array.isArray(data?.foods) ? data.foods : [];

    let items = foods
      .filter((f) => f?.fdcId)
      .map(normalizeUsdaFood)
      .filter((it) => hasUsefulText(it.name))
      .filter((it) => it.brand) // ONLY SHOW BRANDED FOODS
      .filter(hasAnyNutritionItem);

    // light de-dupe
    const seen = new Set();
    items = items.filter((it) => {
      const key = `${it.name.toLowerCase()}|${String(it.brand || "").toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Best-effort enrich with images (UPC -> OpenFoodFacts)
    items = await Promise.all(
      items.map(async (it) => {
        if (!it.upc) return it;
        const imageUrl = await openFoodFactsImageByUpc(it.upc);
        return { ...it, imageUrl: imageUrl || null };
      })
    );

    return res.json({ items });
  } catch (err) {
    console.error("USDA FOODS SEARCH ERROR:", err?.message);
    console.error(err?.stack);
    return res.status(502).json({ error: err?.message || "USDA Food API failed" });
  }
});

export default router;