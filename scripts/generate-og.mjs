// Generates the social-share (Open Graph) image and the PWA app icons into
// /public. Run with: npm run generate:og
//
// Text is set in the bundled Inter Bold (scripts/fonts, SIL Open Font
// License) rather than whatever the machine happens to have installed, so the
// output is identical on every machine.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FONT = resolve(root, 'scripts/fonts/Inter-Bold.ttf');

function render(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: false, fontFiles: [FONT], defaultFontFamily: 'Inter' },
  });
  return resvg.render().asPng();
}

// --- Open Graph image (1200x630) ---
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1220"/>
      <stop offset="1" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="80" y="150" width="120" height="120" rx="24" fill="none" stroke="#3b82f6" stroke-width="8"/>
  <path d="M92 178 L140 214 L188 178" fill="none" stroke="#3b82f6" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="80" y="380" font-family="Inter" font-size="72" font-weight="bold" fill="#ffffff">Email Signature</text>
  <text x="80" y="464" font-family="Inter" font-size="72" font-weight="bold" fill="#3b82f6">Generator</text>
  <text x="80" y="540" font-family="Inter" font-size="30" font-weight="bold" fill="#94a3b8">Free &amp; open source — no login, runs in your browser</text>
</svg>`;
writeFileSync(resolve(root, 'public/og.png'), render(og, 1200));

// --- PWA app icons (envelope on brand background) ---
// `maskable` icons are full-bleed: the OS applies its own mask, so the
// background fills the canvas and the artwork stays inside the central 80%.
function appIcon(size, { maskable = false } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="${maskable ? 0 : 96}" fill="#2563eb"/>
    <rect x="128" y="160" width="256" height="192" rx="24" fill="none" stroke="#ffffff" stroke-width="24"/>
    <path d="M150 196 L256 280 L362 196" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
const iconDir = resolve(root, 'public/icons');
mkdirSync(iconDir, { recursive: true });
writeFileSync(resolve(iconDir, 'app-192.png'), render(appIcon(192), 192));
writeFileSync(resolve(iconDir, 'app-512.png'), render(appIcon(512), 512));
writeFileSync(resolve(iconDir, 'app-512-maskable.png'), render(appIcon(512, { maskable: true }), 512));

console.log('Generated public/og.png and the PWA app icons (including the maskable one).');
