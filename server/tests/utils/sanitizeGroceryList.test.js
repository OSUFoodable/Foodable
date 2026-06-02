import { describe, expect, it } from "vitest";
import {
	normalizeCategory,
	normalizeUnit,
	sanitizeGroceryList,
	toNumberOrNull,
} from "../../src/utils/sanitizeGroceryList.js";

describe("toNumberOrNull", () => {
	it("returns finite numbers as-is", () => {
		expect(toNumberOrNull(5)).toBe(5);
		expect(toNumberOrNull(0)).toBe(0);
		expect(toNumberOrNull(-1.5)).toBe(-1.5);
	});

	it("extracts the first number from a string", () => {
		expect(toNumberOrNull("200g")).toBe(200);
		expect(toNumberOrNull("about 1.5 cups")).toBe(1.5);
	});

	it("returns null for non-numeric input", () => {
		expect(toNumberOrNull("")).toBe(null);
		expect(toNumberOrNull("none")).toBe(null);
		expect(toNumberOrNull(undefined)).toBe(null);
		expect(toNumberOrNull(NaN)).toBe(null);
		expect(toNumberOrNull(Infinity)).toBe(null);
	});
});

describe("normalizeUnit", () => {
	it("defaults to 'count' when empty", () => {
		expect(normalizeUnit("")).toBe("count");
		expect(normalizeUnit(null)).toBe("count");
		expect(normalizeUnit(undefined)).toBe("count");
	});

	it("trims whitespace", () => {
		expect(normalizeUnit("  oz  ")).toBe("oz");
	});

	it("caps length at 20 characters", () => {
		expect(normalizeUnit("a".repeat(50))).toHaveLength(20);
	});
});

describe("normalizeCategory", () => {
	it("accepts the allowed set (case-insensitive)", () => {
		expect(normalizeCategory("Protein")).toBe("protein");
		expect(normalizeCategory("VEGGIES")).toBe("veggies");
	});

	it("falls back to 'other' for unknown values", () => {
		expect(normalizeCategory("snacks")).toBe("other");
		expect(normalizeCategory("")).toBe("other");
		expect(normalizeCategory(null)).toBe("other");
	});
});

describe("sanitizeGroceryList", () => {
	it("returns [] for non-arrays", () => {
		expect(sanitizeGroceryList(null)).toEqual([]);
		expect(sanitizeGroceryList(undefined)).toEqual([]);
		expect(sanitizeGroceryList("nope")).toEqual([]);
		expect(sanitizeGroceryList({})).toEqual([]);
	});

	it("drops entries with empty/missing names", () => {
		const out = sanitizeGroceryList([
			{ name: "rice" },
			{ name: "" },
			{ name: "   " },
			{ qty: 1 },
			{ name: null },
		]);
		expect(out).toHaveLength(1);
		expect(out[0].name).toBe("rice");
	});

	it("trims names and applies defaults", () => {
		const [item] = sanitizeGroceryList([{ name: "  Chicken  " }]);
		expect(item).toEqual({
			name: "Chicken",
			qty: 1,
			unit: "count",
			category: "other",
		});
	});

	it("preserves and normalizes provided fields", () => {
		const [item] = sanitizeGroceryList([
			{ name: "Tofu", qty: "200g", unit: "g", category: "Protein" },
		]);
		expect(item).toEqual({
			name: "Tofu",
			qty: 200,
			unit: "g",
			category: "protein",
		});
	});

	it("caps the list at 60 items", () => {
		const input = Array.from({ length: 100 }, (_, i) => ({
			name: `item-${i}`,
		}));
		expect(sanitizeGroceryList(input)).toHaveLength(60);
	});
});
