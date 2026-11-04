import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { charts: ["recharts"], graph: ["@xyflow/react"] },
      },
    },
  },
  test: {
    include: ["tests/**/*.test.ts", "vendor/engine-phase3/tests/**/*.test.ts"],
  },
});
