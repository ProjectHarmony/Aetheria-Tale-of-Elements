import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // PWA features are production-only by default in vite-plugin-pwa.
      // Keep the dev-mode service worker OFF: it precaches the app shell
      // and ends up serving stale bundles across dev-server reloads,
      // fighting Vite's own HMR/live-reload. Verify installability against
      // a real `npm run build && npm run preview` instead.
      devOptions: { enabled: false },
      includeAssets: ['favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Two Elements',
        short_name: 'Two Elements',
        description: 'Two Elements — an elemental card-battle RPG.',
        theme_color: '#2c1f3d',
        background_color: '#1a1330',
        display: 'standalone',
        orientation: 'any',
        start_url: '/battle',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + built assets are precached; the game has no external
        // API calls yet (in-memory state only), so this is enough for a
        // full offline reload once the app has been visited once.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
