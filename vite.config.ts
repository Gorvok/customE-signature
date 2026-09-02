import { createHash } from 'node:crypto'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Production-only Content Security Policy, injected as a <meta> tag because
 * GitHub Pages cannot set response headers. Every inline <script> left in the
 * final HTML (the theme bootstrap) is hashed at build time, so the policy can
 * never drift from the markup. Dev is untouched: Vite's HMR client relies on
 * inline scripts that a strict policy would block.
 */
function cspMeta(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1])
        const hashes = inlineScripts.map((source) => `'sha256-${createHash('sha256').update(source).digest('base64')}'`)
        const policy = [
          "default-src 'self'",
          `script-src 'self'${hashes.length ? ' ' + hashes.join(' ') : ''}`,
          // Signature HTML and React style props are inline styles.
          "style-src 'self' 'unsafe-inline'",
          // Logos may be hosted anywhere over https or embedded as data URLs.
          "img-src 'self' data: https:",
          "font-src 'self'",
          "connect-src 'self'",
          "worker-src 'self'",
          "manifest-src 'self'",
          "object-src 'none'",
          "base-uri 'none'",
          "form-action 'none'",
        ].join('; ')
        return {
          html,
          tags: [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' }],
        }
      },
    },
  }
}

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
    // Last, so it sees the HTML after every other plugin has injected its tags.
    cspMeta(),
  ],
})
