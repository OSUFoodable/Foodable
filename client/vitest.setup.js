import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers, __resetMockStores } from "./src/mocks/handlers.js";

export const server = setupServer(...handlers);

beforeAll(() => {
	server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
	server.resetHandlers();
	__resetMockStores();
	localStorage.clear();
	sessionStorage.clear();
});

afterAll(() => {
	server.close();
});
