import { describe, expect, it, vi } from "vitest";
import { useContext } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { Authentication, AuthContext } from "../../src/context/AuthContext.jsx";

vi.mock("jwt-decode", () => ({
	jwtDecode: (token) => {
		if (token === "bad") throw new Error("invalid");
		return {
			sub: "user-a",
			email: "a@example.com",
			"cognito:username": "user-a",
		};
	},
}));

vi.mock("../../src/services/authService", () => ({
	syncUser: vi.fn(async () => ({ _id: "user-a", email: "a@example.com" })),
}));

function Consumer() {
	const ctx = useContext(AuthContext);
	return (
		<div>
			<div data-testid="ready">{String(ctx.authReady)}</div>
			<div data-testid="user">{ctx.user ? ctx.user.email : "none"}</div>
		</div>
	);
}

describe("Authentication provider", () => {
	it("initializes to logged-out and ready when no tokens are stored", async () => {
		render(
			<Authentication>
				<Consumer />
			</Authentication>,
		);
		await waitFor(() =>
			expect(screen.getByTestId("ready")).toHaveTextContent("true"),
		);
		expect(screen.getByTestId("user")).toHaveTextContent("none");
	});

	it("decodes the stored id_token into the user on mount", async () => {
		localStorage.setItem("id_token", "good-token");
		localStorage.setItem("access_token", "access-token");

		render(
			<Authentication>
				<Consumer />
			</Authentication>,
		);

		await waitFor(() =>
			expect(screen.getByTestId("user")).toHaveTextContent(
				"a@example.com",
			),
		);
		expect(screen.getByTestId("ready")).toHaveTextContent("true");
	});

	it("clears tokens when the stored id_token is invalid", async () => {
		localStorage.setItem("id_token", "bad");
		localStorage.setItem("access_token", "ax");

		render(
			<Authentication>
				<Consumer />
			</Authentication>,
		);

		await waitFor(() =>
			expect(screen.getByTestId("ready")).toHaveTextContent("true"),
		);
		expect(localStorage.getItem("id_token")).toBe(null);
		expect(localStorage.getItem("access_token")).toBe(null);
		expect(screen.getByTestId("user")).toHaveTextContent("none");
	});
});
