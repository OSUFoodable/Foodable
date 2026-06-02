// Sanitize a grocery list array (typically from AI output or client input):
// drops empty names, coerces qty to a finite number (default 1), normalizes
// unit + category, and caps the list at 60 items.

const ALLOWED_CATEGORIES = new Set([
	"protein",
	"carbs",
	"veggies",
	"fruit",
	"dairy",
	"pantry",
	"other",
]);

export function toNumberOrNull(v) {
	if (typeof v === "number" && Number.isFinite(v)) return v;

	if (typeof v === "string") {
		const m = v.match(/-?\d+(\.\d+)?/);
		if (m) {
			const n = Number(m[0]);
			if (Number.isFinite(n)) return n;
		}
	}
	return null;
}

export function normalizeUnit(v) {
	const unit = (v ?? "").toString().trim();
	if (!unit) return "count";
	return unit.slice(0, 20);
}

export function normalizeCategory(v) {
	const cat = (v ?? "").toString().trim().toLowerCase();
	return ALLOWED_CATEGORIES.has(cat) ? cat : "other";
}

export function sanitizeGroceryList(list) {
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
				qty: qty ?? 1,
				unit,
				category,
			};
		})
		.filter(Boolean);

	return clean.slice(0, 60);
}
