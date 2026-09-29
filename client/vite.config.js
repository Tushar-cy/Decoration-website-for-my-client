import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // We will show a custom update prompt
      includeAssets: [
        'favicon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png',
        'admin-192x192.png',
        'admin-512x512.png',
        'offline.html',
        'admin-manifest.webmanifest',
      ],
      manifest: {
        name: 'Decor Joy Gurgaon',
        short_name: 'DecorJoy',
        description: 'Luxury Event & Party Decorations in Gurgaon. Your Celebration. Our Creation.',
        theme_color: '#b88932',
        background_color: '#f8f4ed',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Network-first for critical business endpoints (quotes, orders, availability, payments, auth)
            // NEVER cache stale pricing or slot availability
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/quotes') ||
              url.pathname.startsWith('/api/orders') ||
              url.pathname.startsWith('/api/availability') ||
              url.pathname.startsWith('/api/payments') ||
              url.pathname.startsWith('/api/auth') ||
              url.pathname.startsWith('/api/submissions'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'decorjoy-critical-network-first',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 20, // Expire rapidly
              },
            },
          },
          {
            // Stale-While-Revalidate for catalogue GETs (products, categories, addons, gallery, testimonials, forms, settings)
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/products') ||
              url.pathname.startsWith('/api/categories') ||
              url.pathname.startsWith('/api/addons') ||
              url.pathname.startsWith('/api/gallery') ||
              url.pathname.startsWith('/api/testimonials') ||
              url.pathname.startsWith('/api/forms') ||
              url.pathname.startsWith('/api/settings/public'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'decorjoy-catalogue-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Stale-While-Revalidate for images (Cloudinary, Unsplash, static assets)
            urlPattern: ({ request, url }) =>
              request.destination === 'image' ||
              url.origin.includes('cloudinary.com') ||
              url.origin.includes('unsplash.com'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'decorjoy-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})
