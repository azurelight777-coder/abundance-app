import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/abundance-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Abundance Manifestation',
        short_name: 'Abundance',
        description: 'A magickal mock banking app for manifestation practice.',
        theme_color: '#011F13',
        background_color: '#011F13',
        display: 'standalone',
        start_url: '/abundance-app/',
        scope: '/abundance-app/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
