import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  // Dev-mount: /api/* → de lokale wrangler-dev-Worker (poort 8787). In prod
  // draaien beide op één origin via de assets-binding (workers/api/wrangler.jsonc).
  // host:true stelt de dev-server BEWUST open op het lokale netwerk (0.0.0.0) zodat
  // Daan vanaf de telefoon op hetzelfde wifi kan kijken; de proxy blijft naar
  // 127.0.0.1:8787 wijzen want wrangler dev draait op dezelfde laptop.
  server: {
    host: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:8787", changeOrigin: true },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Cadans",
        short_name: "Cadans",
        description: "Cadans — training coach",
        theme_color: "#0A0D12",
        background_color: "#0A0D12",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^.*\/api\/.*$/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
});
