import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const localesDir = resolve(__dirname, '../locales');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'vite.svg'],
        manifest: {
          name: 'Neural Study – Offline Learning Hub',
          short_name: 'Neural Study',
          description: 'Offline-first learning platform for rural students.',
          background_color: '#F5F5F5',
          theme_color: '#0A0A0A',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'vite.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: 'vite.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
          ],
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /\/api\/courses/, // cache course metadata
              handler: 'NetworkFirst',
              options: {
                cacheName: 'course-data',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24,
                },
              },
            },
            {
              urlPattern: /https?:.*\.(mp4|pdf|json)(\?.*)?$/,
              handler: 'NetworkOnly',
              options: {
                backgroundSync: {
                  name: 'asset-download-queue',
                  options: {
                    maxRetentionTime: 24 * 60, // retry for up to 24 hours
                  },
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@locales': localesDir,
      },
    },
    server: {
      fs: {
        allow: [localesDir, __dirname],
      },
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
