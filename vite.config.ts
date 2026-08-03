import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'seal.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000 // 5 MB to accommodate the large React app bundle
      },
      manifest: {
        name: 'YantraByte Billing Software',
        short_name: 'YB Billing',
        description: 'YantraByte Billing & Service Management ERP',
        theme_color: '#0EA5E9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/admin',
        icons: [
          {
            src: 'seal.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'seal.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
