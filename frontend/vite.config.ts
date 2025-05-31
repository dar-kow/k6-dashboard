import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@styles": path.resolve(__dirname, "./styles"),
      "@types": path.resolve(__dirname, "./src/types"),
    },
  },
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       additionalData: `
  //       @use "styles/base/variables" as *;
  //       // @use "styles/abstracts/mixins" as *;
  //     `,
  //     },
  //   },
  // },
  server: {
    host: "0.0.0.0", // 🔥 WAŻNE: Dostępność z zewnątrz kontenera
    port: 3000,
    strictPort: true,
    
    // 🚀 Hot Module Replacement dla Dockera
    hmr: {
      port: 3000,
      host: "localhost"
    },
    
    // 📁 Watch options dla lepszego hot reload
    watch: {
      usePolling: true, // Dla systemów plików w kontenerach
      interval: 1000,   // Check co sekundę
    },
    
    // 🔗 Proxy API calls
    proxy: {
      "/api": {
        target: process.env.DOCKER_ENV
          ? "http://backend:4000"
          : "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          redux: ["@reduxjs/toolkit", "react-redux", "redux-saga"],
        },
      },
    },
  },
  base: "/",
});