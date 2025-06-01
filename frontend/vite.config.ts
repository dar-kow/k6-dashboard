import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // JSX runtime
      jsxRuntime: "automatic",
    }),
  ],

  // Development server configuration
  server: {
    host: "0.0.0.0", // Allow external connections (important for Docker)
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000, // HMR port for Docker
      host: "localhost",
    },
    watch: {
      usePolling: true, // For Docker file system watching
      interval: 100,
    },
  },

  // Build configuration
  build: {
    outDir: "dist",
    sourcemap: true,
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ["react", "react-dom", "react-router-dom"],
          redux: ["@reduxjs/toolkit", "react-redux", "redux-saga"],
          charts: ["recharts"],
          utils: ["axios", "lodash-es"],
        },
      },
    },
    // Optimize chunks
    chunkSizeWarningLimit: 1000,
  },

  // Path resolution
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@components": resolve(__dirname, "src/components"),
      "@pages": resolve(__dirname, "src/pages"),
      "@hooks": resolve(__dirname, "src/hooks"),
      "@store": resolve(__dirname, "src/store"),
      "@api": resolve(__dirname, "src/api"),
      "@utils": resolve(__dirname, "src/utils"),
      "@styles": resolve(__dirname, "src/styles"),
      "@types": resolve(__dirname, "src/types"),
    },
  },

  // CSS configuration
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/styles/abstracts/variables";
          @import "@/styles/abstracts/mixins";
        `,
      },
    },
    modules: {
      localsConvention: "camelCase",
    },
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@reduxjs/toolkit",
      "react-redux",
      "redux-saga",
      "axios",
      "recharts",
      "socket.io-client",
    ],
    exclude: ["@react-pdf/renderer"], // This might cause issues in development
  },

  // Preview configuration (for production preview)
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
});
