import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../vitest.setup.js";
import { AuthContext } from "../../src/context/AuthContext.jsx";
import MyLists from "../../src/pages/MyLists.jsx";

function renderWithUser() {
	const user = {
		sub: "user-a",
		email: "a@example.com",
		"cognito:username": "user-a",
	};
	return render(
		<AuthContext.Provider value={{ user, authReady: true }}>
			<MyLists />
		</AuthContext.Provider>,
	);
}

describe("MyLists page", () => {
	it("renders the loading message then the empty-state hint", async () => {
		renderWithUser();
		expect(screen.getByText(/loading lists/i)).toBeInTheDocument();
		await waitFor(() =>
			expect(
				screen.getByText(/no grocery lists saved yet/i),
			).toBeInTheDocument(),
		);
	});

	it("renders the lists returned by the API", async () => {
		server.use(
			http.get("/api/lists", () =>
				HttpResponse.json({
					items: [
						{
							_id: "list-1",
							title: "Weekly Groceries",
							items: [
								{ name: "tofu", qty: 2, unit: "block" },
							],
							createdAt: new Date().toISOString(),
						},
					],
				}),
			),
		);
		renderWithUser();
		await waitFor(() =>
			expect(
				screen.getByText("Weekly Groceries"),
			).toBeInTheDocument(),
		);
		expect(screen.getByText("tofu")).toBeInTheDocument();
	});

	it("shows an error message when the API errors", async () => {
		server.use(
			http.get("/api/lists", () =>
				HttpResponse.json(
					{ error: { message: "lists failed" } },
					{ status: 500 },
				),
			),
		);
		renderWithUser();
		await waitFor(() =>
			expect(screen.getByText(/lists failed/i)).toBeInTheDocument(),
		);
	});
});
