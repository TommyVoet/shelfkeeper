import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// Gehost op GitHub Pages onder /shelfkeeper/ — dev-server gebruikt dezelfde base,
// zodat paden in ontwikkeling en productie identiek zijn.
export default defineConfig({
  base: '/shelfkeeper/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Shelfkeeper',
        short_name: 'Shelfkeeper',
        description: 'Keep track of the books you own. Scan, search, shelve — offline and private.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f7f5f2',
        theme_color: '#2f6b52',
        categories: ['books', 'productivity', 'lifestyle'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // Alleen de latijnse letterbestanden vooraf cachen; cyrillisch/grieks/vietnamees
        // worden door de browser toch nooit opgehaald voor EN/NL/FR.
        globPatterns: ['**/*.{js,css,html,svg,png,wasm}', '**/*latin*.woff2'],
        // Diepe links (/book/…) moeten de app-shell krijgen, geen 404.
        navigateFallback: '/shelfkeeper/index.html',
        navigateFallbackDenylist: [/^\/shelfkeeper\/assets\//],
        // Omslagen mogen lang blijven staan: ze veranderen niet.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/covers\.openlibrary\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ol-covers',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/openlibrary\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ol-api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5273 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
