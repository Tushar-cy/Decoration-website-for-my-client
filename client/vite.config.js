import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sentryEnabled = !!env.SENTRY_AUTH_TOKEN

  return {
  plugins: [
    react(),
    // Upload source maps to Sentry — only active when SENTRY_AUTH_TOKEN is set (CI only)
    ...(sentryEnabled ? [
      sentryVitePlugin({
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT || 'decorjoy-client',
        authToken: env.SENTRY_AUTH_TOKEN,
        release: { name: env.VITE_SENTRY_RELEASE },
        sourcemaps: { assets: './dist/assets/**' },
        telemetry: false,
      })
    ] : []),
  ],
  build: {
    sourcemap: sentryEnabled ? true : false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            return 'vendor';
          }
          if (id.includes('/src/admin/')) {
            return 'admin';
          }
        },
      },
    },
  },
  }
})
