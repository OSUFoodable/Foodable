import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import User from "../../src/models/User.js";
import { verifyState } from "../setup.js";

describe("POST /api/auth/sync", () => {
	it("returns 400 when idToken is missing", async () => {
		const res = await request(app).post("/api/auth/sync").send({});
		expect(res.status).toBe(400);
	});

	it("returns 401 when the verifier rejects the token", async () => {
		verifyState.implementation = async () => {
			throw new Error("invalid");
		};
		const res = await request(app)
			.post("/api/auth/sync")
			.send({ idToken: "junk" });
		expect(res.status).toBe(401);
	});

	it("upserts a User keyed by Cognito sub on a valid token", async () => {
		verifyState.implementation = async () => ({
			sub: "user-new",
			email: "new@example.com",
			"cognito:username": "newuser",
		});
		const res = await request(app)
			.post("/api/auth/sync")
			.send({ idToken: "good-token" });
		expect(res.status).toBe(200);
		expect(res.body._id).toBe("user-new");
		expect(res.body.email).toBe("new@example.com");

		const saved = await User.findById("user-new");
		expect(saved.username).toBe("newuser");
		expect(saved.lastLoginAt).toBeTruthy();
	});

	it("updates lastLoginAt on subsequent sync calls", async () => {
		verifyState.implementation = async () => ({
			sub: "user-returning",
			email: "ret@example.com",
			"cognito:username": "ret",
		});
		await request(app)
			.post("/api/auth/sync")
			.send({ idToken: "t1" });
		const first = await User.findById("user-returning");

		await new Promise((r) => setTimeout(r, 10));

		await request(app)
			.post("/api/auth/sync")
			.send({ idToken: "t2" });
		const second = await User.findById("user-returning");

		expect(second.lastLoginAt.getTime()).toBeGreaterThan(
			first.lastLoginAt.getTime(),
		);
	});
});
