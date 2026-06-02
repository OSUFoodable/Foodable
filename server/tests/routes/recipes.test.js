import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import Recipe from "../../src/models/Recipe.js";
import { verifyState } from "../setup.js";

function asUser(sub) {
	verifyState.implementation = async () => ({
		sub,
		username: sub,
		"cognito:username": sub,
	});
}

function seedRecipe(userId, overrides = {}) {
	return Recipe.create({
		name: "Test Recipe",
		ingredients: ["one", "two"],
		instructions: "do it",
		userId,
		...overrides,
	});
}

describe("recipes routes", () => {
	it("rejects unauthenticated GET with 401", async () => {
		const res = await request(app).get("/api/recipes");
		expect(res.status).toBe(401);
	});

	it("only returns recipes owned by the authenticated user", async () => {
		await seedRecipe("user-a", { name: "A1" });
		await seedRecipe("user-a", { name: "A2" });
		await seedRecipe("user-b", { name: "B1" });

		asUser("user-a");
		const res = await request(app)
			.get("/api/recipes")
			.set("Authorization", "Bearer token");

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(2);
		expect(res.body.map((r) => r.name).sort()).toEqual(["A1", "A2"]);
	});

	it("POST forces userId from the access token, not the request body", async () => {
		asUser("user-a");
		const res = await request(app)
			.post("/api/recipes")
			.set("Authorization", "Bearer token")
			.send({
				name: "Spoof",
				ingredients: ["x"],
				instructions: "y",
				userId: "user-b",
			});

		expect(res.status).toBe(201);
		expect(res.body.userId).toBe("user-a");

		const all = await Recipe.find({});
		expect(all).toHaveLength(1);
		expect(all[0].userId).toBe("user-a");
	});

	it("GET /:id returns 404 when the recipe belongs to another user", async () => {
		const other = await seedRecipe("user-b", { name: "secret" });

		asUser("user-a");
		const res = await request(app)
			.get(`/api/recipes/${other._id}`)
			.set("Authorization", "Bearer token");
		expect(res.status).toBe(404);
	});

	it("PUT /:id returns 404 for another user's recipe and leaves it unchanged", async () => {
		const other = await seedRecipe("user-b", { name: "original" });

		asUser("user-a");
		const res = await request(app)
			.put(`/api/recipes/${other._id}`)
			.set("Authorization", "Bearer token")
			.send({ name: "hacked" });
		expect(res.status).toBe(404);

		const stillThere = await Recipe.findById(other._id);
		expect(stillThere.name).toBe("original");
	});

	it("DELETE /:id returns 404 for another user's recipe and leaves it intact", async () => {
		const other = await seedRecipe("user-b");

		asUser("user-a");
		const res = await request(app)
			.delete(`/api/recipes/${other._id}`)
			.set("Authorization", "Bearer token");
		expect(res.status).toBe(404);

		const stillThere = await Recipe.findById(other._id);
		expect(stillThere).not.toBeNull();
	});
});
