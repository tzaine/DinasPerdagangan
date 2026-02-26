import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ["leaflet", "react-leaflet"],
          chartjs: ["chart.js", "react-chartjs-2"],
          vendor: ["react", "react-dom", "react-router-dom"],
          zustand: ["zustand"],
          admin: [
            "./src/pages/admin/AdminDashboard",
            "./src/pages/admin/KiosManagement",
            "./src/pages/admin/LayerManagement",
          ],
        },
      },
    },
  },
});
