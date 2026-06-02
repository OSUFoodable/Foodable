import { describe, expect, it } from "vitest";
import {
	getDisplayName,
	getInitial,
	getUsername,
} from "../../src/utils/authHelpers.js";

describe("getDisplayName", () => {
	it("returns 'guest' when no user is provided", () => {
		expect(getDisplayName(null)).toBe("guest");
		expect(getDisplayName(undefined)).toBe("guest");
	});

	it("follows the fallback chain: name > preferred_username > given_name > nickname > email-local > cognito:username > 'guest'", () => {
		expect(getDisplayName({ name: "Alice", email: "a@b.com" })).toBe(
			"Alice",
		);
		expect(
			getDisplayName({
				preferred_username: "alice99",
				email: "a@b.com",
			}),
		).toBe("alice99");
		expect(
			getDisplayName({ given_name: "Bob", email: "a@b.com" }),
		).toBe("Bob");
		expect(getDisplayName({ nickname: "Cher" })).toBe("Cher");
		expect(getDisplayName({ email: "carol@example.com" })).toBe("carol");
		expect(getDisplayName({ "cognito:username": "uuid-abc" })).toBe(
			"uuid-abc",
		);
		expect(getDisplayName({})).toBe("guest");
	});
});

describe("getUsername", () => {
	it("prefers cognito:username (rename-stable) over email and username", () => {
		expect(
			getUsername({
				"cognito:username": "sub-1",
				username: "alt",
				email: "x@y.com",
			}),
		).toBe("sub-1");
	});

	it("falls back through username → email → 'guest'", () => {
		expect(getUsername({ username: "alt", email: "x@y.com" })).toBe("alt");
		expect(getUsername({ email: "x@y.com" })).toBe("x@y.com");
		expect(getUsername({})).toBe("guest");
		expect(getUsername(null)).toBe("guest");
	});
});

describe("getInitial", () => {
	it("uppercases the first character of the display name", () => {
		expect(getInitial({ name: "Alice" })).toBe("A");
		expect(getInitial({ email: "ben@x.com" })).toBe("B");
	});

	it("returns 'U' when nothing is available", () => {
		expect(getInitial(null)).toBe("G"); // "guest"
		expect(getInitial({})).toBe("G");
	});
});
