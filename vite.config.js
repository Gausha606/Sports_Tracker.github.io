import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "favicon-96x96.png",
      ], // Static assets
      manifest: {
        id: "/",
        name: "Cricket",
        short_name: "Cricket",
        description: "Management App for Gwalior Sports Events and Activities",
        theme_color: "#000000",
        icons: [
          {
            src: "favicon-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable_icon_x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "maskable any",
          },
          {
            src: "maskable_icon_x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable any",
          },
          {
            src: "maskable_icon_x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any",
          },
        ],
        screenshots: [
          {
            src: "/screenshot-mobile.png",
            sizes: "708x623",
            type: "image/png",
            form_factor: "narrow",
            label: "Cricket Mobile View",
          },
          {
            src: "/screenshot-desktop.png",
            sizes: "1348x633",
            type: "image/png",
            form_factor: "wide",
            label: "Cricket Desktop View",
          },
        ],
      },
      workbox: {
        // Isse aapka app "Fast" aur "Offline" chalega
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
});
