import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add server configuration with proxy for API requests during development
  server: {
    port: 5137,
    proxy: {
      // Proxy API requests to your backend server
      '/api': {
        target: 'http://localhost:4000', // Change this to your backend server URL
        changeOrigin: true,
        secure: false,
      }
    }
  }
})