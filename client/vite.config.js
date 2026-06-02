import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		proxy: {
			"/api": "http://localhost:5050",
		},
	},
	optimizeDeps: {
		include: ["jwt-decode"],
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.js"],
		css: false,
	},
});
