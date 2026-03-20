import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import path from "node:path";

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../../packages/shared"),
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
});
