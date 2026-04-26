import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/abundance-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
      },
      includeAssets: ['cat.png', 'dragon.png', 'manta.png', 'sakura_dragon.png', 'ancient_dragon.png', 'fae-bg.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Abundance Manifestation',
        short_name: 'Abundance',
        description: 'A magickal mock banking app for manifestation practice.',
        theme_color: '#011F13',
        background_color: '#011F13',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/abundance-app/',
        scope: '/abundance-app/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
});
