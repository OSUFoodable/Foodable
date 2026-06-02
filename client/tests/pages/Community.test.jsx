import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthContext } from "../../src/context/AuthContext.jsx";
import Community from "../../src/pages/Community.jsx";

// Community uses a localStorage-backed posts service, not the API.
// We mock the service directly so the test isn't entangled with the seed-if-empty behavior.
vi.mock("../../src/services/communityPostsService", () => ({
	getPosts: vi.fn(),
	createCommunityPost: vi.fn(),
}));

vi.mock("../../src/services/savedPostsService", () => ({
	loadSavedPosts: () => [],
	savePost: () => [],
	unsavePost: () => [],
}));

import { getPosts } from "../../src/services/communityPostsService";

function renderWithUser() {
	const user = { email: "a@example.com" };
	return render(
		<AuthContext.Provider value={{ user, authReady: true }}>
			<Community />
		</AuthContext.Provider>,
	);
}

describe("Community page", () => {
	it("renders the welcome header with the display name", async () => {
		getPosts.mockResolvedValueOnce([]);
		renderWithUser();
		await waitFor(() =>
			expect(screen.getByText(/welcome, a!/i)).toBeInTheDocument(),
		);
		expect(screen.getByText("0 posts")).toBeInTheDocument();
	});

	it("renders posts returned by the service", async () => {
		getPosts.mockResolvedValueOnce([
			{
				id: "p1",
				title: "Quick lunch",
				body: "what do you cook with chicken and rice",
				author: "Sam",
				tags: ["protein"],
				createdAt: new Date().toISOString(),
			},
		]);
		renderWithUser();
		await waitFor(() =>
			expect(screen.getByText("Quick lunch")).toBeInTheDocument(),
		);
		expect(screen.getByText("1 post")).toBeInTheDocument();
	});

	it("renders an error state when getPosts throws", async () => {
		getPosts.mockRejectedValueOnce(new Error("nope"));
		renderWithUser();
		await waitFor(() =>
			expect(
				screen.getByText(/failed to load posts/i),
			).toBeInTheDocument(),
		);
	});
});
