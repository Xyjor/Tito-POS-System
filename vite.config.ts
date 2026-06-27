import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    target: "ES2020",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          router: ["react-router-dom"],
          charts: ["recharts"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
  },
});
