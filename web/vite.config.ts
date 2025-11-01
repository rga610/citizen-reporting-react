import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: "Campus Hunt",
      short_name: "Hunt",
      start_url: "/",
      display: "standalone",
      theme_color: "#0ea5e9",
      background_color: "#ffffff",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
      ]
    }
  })],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})