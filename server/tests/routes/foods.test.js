import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

const originalFetch = global.fetch;

afterEach(() => {
	global.fetch = originalFetch;
});

describe("GET /api/foods/search", () => {
	it("returns an empty list when the query is missing", async () => {
		const res = await request(app).get("/api/foods/search");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ items: [] });
	});

	it("normalizes a USDA hit into the expected shape", async () => {
		global.fetch = vi.fn(async (url) => {
			if (String(url).includes("api.nal.usda.gov")) {
				return new Response(
					JSON.stringify({
						foods: [
							{
								fdcId: 1,
								description: "Brand Chicken Breast",
								brandOwner: "Acme",
								foodNutrients: [
									{ nutrientName: "Energy", value: 165 },
									{ nutrientName: "Protein", value: 31 },
									{
										nutrientName: "Carbohydrate, by difference",
										value: 0,
									},
									{
										nutrientName: "Total lipid (fat)",
										value: 3.6,
									},
								],
							},
						],
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			}
			// Block OpenFoodFacts enrichment in tests.
			return new Response("{}", { status: 404 });
		});

		const res = await request(app).get("/api/foods/search?q=chicken");
		expect(res.status).toBe(200);
		expect(res.body.items).toHaveLength(1);
		const item = res.body.items[0];
		expect(item.name).toBe("Brand Chicken Breast");
		expect(item.brand).toBe("Acme");
		expect(item.source).toBe("usda");
		expect(item.nutrition.protein).toBe(31);
	});

	it("surfaces upstream failure as 502", async () => {
		global.fetch = vi.fn(
			async () =>
				new Response("upstream went boom", { status: 500 }),
		);
		const res = await request(app).get("/api/foods/search?q=anything");
		expect(res.status).toBe(502);
	});

	it("filters out items without a brand (USDA Foundation/Survey rows)", async () => {
		global.fetch = vi.fn(
			async () =>
				new Response(
					JSON.stringify({
						foods: [
							{
								fdcId: 2,
								description: "Generic Rice",
								// no brandOwner / brandName
								foodNutrients: [
									{ nutrientName: "Energy", value: 130 },
								],
							},
						],
					}),
					{ status: 200 },
				),
		);
		const res = await request(app).get("/api/foods/search?q=rice");
		expect(res.status).toBe(200);
		expect(res.body.items).toEqual([]);
	});
});
