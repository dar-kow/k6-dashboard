import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0", // Dla kompatybilności z Dockerem
    watch: {
      usePolling: true, // Dla poprawnego działania HMR w środowisku Docker
    },
  },
});
