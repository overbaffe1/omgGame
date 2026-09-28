import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Точка входа игры — game/index.html (корневой index.html отдан хабу фильмов)
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, "game/index.html"),
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    cors: true,
    headers: {
      'X-Frame-Options': 'ALLOWALL',
    },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
