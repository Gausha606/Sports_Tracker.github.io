import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from "vite-plugin-pwa";


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),
     VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"], // Static assets
      manifest: {
        id: "/",
        name: "Sports Tracker",
        short_name: "TC",
        description: "Management App for Gwalior Sports Events and Activities",
        theme_color: "#000000",
        icons: [
          {
            src: "android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
        screenshots: [
          {
            src: "/screenshot-mobile.png",
            sizes: "708x623",
            type: "image/png",
            form_factor: "narrow",
            label: "Gwalior ERP Mobile View",
          },
          {
            src: "/screenshot-desktop.png",
            sizes: "1348x633",
            type: "image/png",
            form_factor: "wide",
            label: "Gwalior ERP Desktop View",
          },
        ],
      },
      workbox: {
        // Isse aapka app "Fast" aur "Offline" chalega
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
})
