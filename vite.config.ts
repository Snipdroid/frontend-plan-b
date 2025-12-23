import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react/jsx-runtime', 'react-dom'],

          // React Router
          'router': ['react-router'],

          // Authentication
          'auth': ['react-oidc-context', 'oidc-client-ts'],

          // i18n
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],

          // UI components (Radix UI) - base components
          'ui-base': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
          ],

          // UI components (Radix UI) - extended components
          'ui-extended': [
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-tooltip',
          ],

          // Icons
          'icons': ['lucide-react'],

          // Utilities
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        // target: "https://apptracker.sg.butanediol.me",
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
