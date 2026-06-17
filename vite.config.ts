import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/customE-signature/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['og.png'],
      manifest: {
        name: 'Email Signature Generator',
        short_name: 'Signature',
        description: 'Create professional email signatures in your browser — free, open source, no login.',
        theme_color: '#2563eb',
        background_color: '#0b1220',
        display: 'standalone',
        scope: '/customE-signature/',
        start_url: '/customE-signature/',
        icons: [
          { src: 'icons/app-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/app-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
