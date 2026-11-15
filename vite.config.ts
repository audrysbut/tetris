import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import path from "node:path";
import { fileURLToPath } from "node:url"; // Import this for ES modules

// Define __dirname manually if using ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/tetris/",
  plugins: [preact()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      react: "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
  server: {
    port: 4200,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    include: ["preact/jsx-runtime", "preact", "preact/compat"],
  },
}));