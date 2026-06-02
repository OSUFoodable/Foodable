import { describe, expect, it } from "vitest";
import requireAuth from "../../src/middleware/requireAuth.js";
import { verifyState } from "../setup.js";

function makeRes() {
	const res = {};
	res.status = (code) => {
		res.statusCode = code;
		return res;
	};
	res.json = (body) => {
		res.body = body;
		return res;
	};
	return res;
}

describe("requireAuth", () => {
	it("returns 401 when no Authorization header is present", async () => {
		const req = { headers: {} };
		const res = makeRes();
		let called = false;
		await requireAuth(req, res, () => {
			called = true;
		});
		expect(res.statusCode).toBe(401);
		expect(res.body.error.message).toMatch(/Missing or invalid/);
		expect(called).toBe(false);
	});

	it("returns 401 when scheme is not 'Bearer'", async () => {
		const req = { headers: { authorization: "Basic abc.def" } };
		const res = makeRes();
		let called = false;
		await requireAuth(req, res, () => {
			called = true;
		});
		expect(res.statusCode).toBe(401);
		expect(called).toBe(false);
	});

	it("returns 401 when verifier throws", async () => {
		verifyState.implementation = async () => {
			throw new Error("token expired");
		};
		const req = { headers: { authorization: "Bearer bad-token" } };
		const res = makeRes();
		let called = false;
		await requireAuth(req, res, () => {
			called = true;
		});
		expect(res.statusCode).toBe(401);
		expect(res.body.error.message).toBe("Unauthorized");
		expect(called).toBe(false);
	});

	it("populates req.user and calls next on a valid Bearer token", async () => {
		verifyState.implementation = async () => ({
			sub: "user-xyz",
			username: "claire",
		});
		const req = { headers: { authorization: "Bearer ok-token" } };
		const res = makeRes();
		let called = false;
		await requireAuth(req, res, () => {
			called = true;
		});
		expect(called).toBe(true);
		expect(req.user).toEqual({ sub: "user-xyz", username: "claire" });
		expect(res.statusCode).toBeUndefined();
	});
});
