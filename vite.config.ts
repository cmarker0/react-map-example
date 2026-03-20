/// <reference types="vitest/config" />

import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    checker({
      typescript: true,
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/setupTests.ts",
  },
});
