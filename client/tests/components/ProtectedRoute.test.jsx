import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../../src/context/AuthContext.jsx";
import ProtectedRoute from "../../src/components/ProtectedRoute.jsx";

function renderWithAuth(ctxValue, initialEntries = ["/protected"]) {
	return render(
		<AuthContext.Provider value={ctxValue}>
			<MemoryRouter initialEntries={initialEntries}>
				<Routes>
					<Route path="/" element={<div>home</div>} />
					<Route
						path="/protected"
						element={
							<ProtectedRoute>
								<div>secret</div>
							</ProtectedRoute>
						}
					/>
				</Routes>
			</MemoryRouter>
		</AuthContext.Provider>,
	);
}

describe("ProtectedRoute", () => {
	it("renders a loading indicator while authReady is false", () => {
		renderWithAuth({ user: null, authReady: false });
		expect(screen.getByText(/loading/i)).toBeInTheDocument();
	});

	it("redirects to / when the user is unauthenticated", () => {
		renderWithAuth({ user: null, authReady: true });
		expect(screen.getByText("home")).toBeInTheDocument();
		expect(screen.queryByText("secret")).not.toBeInTheDocument();
	});

	it("renders children when the user is authenticated", () => {
		renderWithAuth({ user: { sub: "x" }, authReady: true });
		expect(screen.getByText("secret")).toBeInTheDocument();
	});
});
