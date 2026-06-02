import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import Ingredient from "../../src/models/Ingredient.js";
import { verifyState } from "../setup.js";

function asUser(sub) {
	verifyState.implementation = async () => ({
		sub,
		username: sub,
		"cognito:username": sub,
	});
}

describe("ingredients routes", () => {
	it("rejects unauthenticated GET with 401", async () => {
		const res = await request(app).get("/api/ingredients");
		expect(res.status).toBe(401);
	});

	it("only returns ingredients owned by the authenticated user", async () => {
		await Ingredient.create({ name: "rice", userId: "user-a" });
		await Ingredient.create({ name: "tofu", userId: "user-a" });
		await Ingredient.create({ name: "beef", userId: "user-b" });

		asUser("user-a");
		const res = await request(app)
			.get("/api/ingredients")
			.set("Authorization", "Bearer token");

		expect(res.status).toBe(200);
		expect(res.body.items).toHaveLength(2);
		expect(res.body.items.map((i) => i.name).sort()).toEqual([
			"rice",
			"tofu",
		]);
	});

	it("POST forces userId from the access token", async () => {
		asUser("user-a");
		const res = await request(app)
			.post("/api/ingredients")
			.set("Authorization", "Bearer token")
			.send({ name: "eggs", userId: "user-b" });

		expect(res.status).toBe(201);
		expect(res.body.userId).toBe("user-a");
	});

	it("DELETE /:id returns 404 for another user's ingredient and leaves it intact", async () => {
		const other = await Ingredient.create({
			name: "guarded",
			userId: "user-b",
		});

		asUser("user-a");
		const res = await request(app)
			.delete(`/api/ingredients/${other._id}`)
			.set("Authorization", "Bearer token");
		expect(res.status).toBe(404);

		const stillThere = await Ingredient.findById(other._id);
		expect(stillThere).not.toBeNull();
	});

	it("PUT /:id returns 404 for another user's ingredient", async () => {
		const other = await Ingredient.create({
			name: "guarded",
			userId: "user-b",
		});

		asUser("user-a");
		const res = await request(app)
			.put(`/api/ingredients/${other._id}`)
			.set("Authorization", "Bearer token")
			.send({ name: "hacked" });
		expect(res.status).toBe(404);
	});
});
