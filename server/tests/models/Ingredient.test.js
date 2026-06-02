import { describe, expect, it } from "vitest";
import Ingredient from "../../src/models/Ingredient.js";

describe("Ingredient model", () => {
	it("requires name and userId", async () => {
		const err = await new Ingredient({}).validate().catch((e) => e);
		expect(err).toBeTruthy();
		expect(err.errors.name).toBeTruthy();
		expect(err.errors.userId).toBeTruthy();
	});

	it("defaults qty to 0, unit to 'count', addedAt to a Date", async () => {
		const saved = await Ingredient.create({
			name: "rice",
			userId: "user-a",
		});
		expect(saved.qty).toBe(0);
		expect(saved.unit).toBe("count");
		expect(saved.addedAt).toBeInstanceOf(Date);
	});

	it("trims the name on save", async () => {
		const saved = await Ingredient.create({
			name: "   spinach   ",
			userId: "user-a",
		});
		expect(saved.name).toBe("spinach");
	});
});
