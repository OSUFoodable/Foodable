import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "../../src/services/apiClient.js";

function mockFetch(impl) {
	global.fetch = vi.fn(impl);
}

describe("apiFetch", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sets Content-Type: application/json and credentials: 'omit' on every request", async () => {
		mockFetch(async () => new Response("null", { status: 200 }));
		await apiFetch("/api/test");
		const [, init] = global.fetch.mock.calls[0];
		expect(init.credentials).toBe("omit");
		expect(init.headers.get("Content-Type")).toBe("application/json");
	});

	it("attaches an Authorization Bearer header when access_token is present", async () => {
		localStorage.setItem("access_token", "abc.def.ghi");
		mockFetch(async () => new Response("null", { status: 200 }));
		await apiFetch("/api/whatever");
		const [, init] = global.fetch.mock.calls[0];
		expect(init.headers.get("Authorization")).toBe("Bearer abc.def.ghi");
	});

	it("omits the Authorization header when no token is stored", async () => {
		mockFetch(async () => new Response("null", { status: 200 }));
		await apiFetch("/api/whatever");
		const [, init] = global.fetch.mock.calls[0];
		expect(init.headers.get("Authorization")).toBeNull();
	});

	it("returns null on a 204 without reading the body", async () => {
		const json = vi.fn();
		mockFetch(
			async () =>
				new Response(null, {
					status: 204,
					headers: { "Content-Type": "application/json" },
				}),
		);
		const out = await apiFetch("/api/empty");
		expect(out).toBe(null);
	});

	it("throws with the server's error.message on non-2xx", async () => {
		mockFetch(
			async () =>
				new Response(
					JSON.stringify({ error: { message: "boom from server" } }),
					{ status: 400 },
				),
		);
		await expect(apiFetch("/api/bad")).rejects.toThrow("boom from server");
	});

	it("falls back to data.message, then to a generic message", async () => {
		mockFetch(
			async () =>
				new Response(JSON.stringify({ message: "alt path" }), {
					status: 500,
				}),
		);
		await expect(apiFetch("/api/bad")).rejects.toThrow("alt path");

		mockFetch(
			async () =>
				new Response("not json", {
					status: 503,
					headers: { "Content-Type": "text/plain" },
				}),
		);
		await expect(apiFetch("/api/bad")).rejects.toThrow(
			"Request failed 503",
		);
	});
});
