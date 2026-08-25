import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Allow all tunnel domains for development (Cloudflare, localtunnel, ngrok)
    allowedHosts: [
      ".trycloudflare.com",
      ".loca.lt",
      ".ngrok.io",
      ".ngrok-free.app",
    ],
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/uploads": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});