import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../vitest.setup.js";
import { AuthContext } from "../../src/context/AuthContext.jsx";
import IngredientsPage from "../../src/pages/Ingredients.jsx";

function renderWithUser() {
	const user = {
		sub: "user-a",
		email: "a@example.com",
		"cognito:username": "user-a",
	};
	return render(
		<AuthContext.Provider value={{ user, authReady: true }}>
			<IngredientsPage />
		</AuthContext.Provider>,
	);
}

describe("Ingredients page", () => {
	it("renders loading and then the empty state", async () => {
		renderWithUser();
		expect(screen.getByText(/loading ingredients/i)).toBeInTheDocument();
		await waitFor(() =>
			expect(
				screen.getByText(/no results\. try a different search/i),
			).toBeInTheDocument(),
		);
	});

	it("adds an ingredient via the form and shows it in the list", async () => {
		renderWithUser();
		await waitFor(() =>
			expect(
				screen.getByText(/no results\. try a different search/i),
			).toBeInTheDocument(),
		);

		const u = userEvent.setup();
		const input = screen.getByLabelText(/add ingredient/i);
		await u.type(input, "uniquetestingredient{Enter}");

		// Scope to the ingredient table — the same name also appears in the
		// "Recently added" sidebar after a successful add.
		await waitFor(() => {
			const table = screen.getByRole("table");
			expect(
				within(table).getByText("uniquetestingredient"),
			).toBeInTheDocument();
		});
	});

	it("surfaces an error banner when the API returns 500", async () => {
		server.use(
			http.get("/api/ingredients", () =>
				HttpResponse.json(
					{ error: { message: "list blew up" } },
					{ status: 500 },
				),
			),
		);
		renderWithUser();
		await waitFor(() =>
			expect(screen.getByRole("alert")).toHaveTextContent(
				/list blew up/i,
			),
		);
	});
});
