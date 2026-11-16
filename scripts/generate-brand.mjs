// Generates every file that carries Envoi's mark: the favicon, the PWA app
// icons, the Apple touch icon and the Open Graph image. Run with:
//   npm run generate:brand
//
// The geometry comes from src/data/brandMark.json, the same file the app's
// <BrandMark> component draws, so the browser tab and the header can never
// show different marks. Text is set in the bundled Inter Bold (scripts/fonts,
// SIL Open Font License) rather than whatever the machine has installed, so
// the output is identical everywhere.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FONT = resolve(root, 'scripts/fonts/Inter-Bold.ttf');
const mark = JSON.parse(readFileSync(resolve(root, 'src/data/brandMark.json'), 'utf8'));

// Kept in step with src/brand.ts by a test, which fails if either moves.
const INK = '#14110E';
const AMBER = '#E9A23B';
const PAPER = '#F7F2E8';

function render(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: false, fontFiles: [FONT], defaultFontFamily: 'Inter' },
  });
  return resvg.render().asPng();
}

/** The letter, as bars; `scale` shrinks it about the center for maskable icons. */
function letter(fill, scale = 1) {
  const bars = mark.letter
    .map((b) => `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}" fill="${fill}"/>`)
    .join('');
  if (scale === 1) return bars;
  return `<g transform="translate(256,256) scale(${scale}) translate(-256,-256)">${bars}</g>`;
}

/**
 * The mark. `background` omitted gives a free-standing seal with transparent
 * corners, which is what a browser tab wants; `radius` 0 gives the full-bleed
 * square a maskable icon needs, since the launcher applies its own mask.
 */
function markSvg({ background, seal = AMBER, ink = INK, radius = mark.cornerRadius, scale = 1 }) {
  const tile = background
    ? `<rect width="512" height="512" rx="${radius}" fill="${background}"/>`
    : '';
  const r = mark.seal.r * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="${mark.viewBox}">
  ${tile}<circle cx="${mark.seal.cx}" cy="${mark.seal.cy}" r="${r}" fill="${seal}"/>${letter(ink, scale)}
</svg>`;
}

const iconDir = resolve(root, 'public/icons');
mkdirSync(iconDir, { recursive: true });

// --- Favicon: an SVG that works on a light or a dark tab strip, because the
// seal carries its own color and the corners stay transparent. ---
writeFileSync(resolve(root, 'public/favicon.svg'), markSvg({}));
// PNG fallbacks for the browsers and crawlers that ignore SVG favicons.
writeFileSync(resolve(root, 'public/favicon-32.png'), render(markSvg({ background: INK }), 32));
writeFileSync(resolve(root, 'public/favicon-16.png'), render(markSvg({ background: INK }), 16));

// --- App icons. Apple ignores the manifest and needs its own; Android masks
// its own shape out of the maskable one, so that stays full-bleed with the
// artwork inside the safe area. ---
writeFileSync(resolve(iconDir, 'app-180.png'), render(markSvg({ background: INK }), 180));
writeFileSync(resolve(iconDir, 'app-192.png'), render(markSvg({ background: INK }), 192));
writeFileSync(resolve(iconDir, 'app-512.png'), render(markSvg({ background: INK }), 512));
writeFileSync(
  resolve(iconDir, 'app-512-maskable.png'),
  render(markSvg({ background: INK, radius: 0, scale: 0.8 }), 512),
);

// --- Open Graph image (1200x630): the lockup, on ink. ---
const seal = `<g transform="translate(80,150) scale(0.31)">${
  `<circle cx="${mark.seal.cx}" cy="${mark.seal.cy}" r="${mark.seal.r}" fill="${AMBER}"/>${letter(INK)}`
}</g>`;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${INK}"/>
  ${seal}
  <!-- A dotless \u0131, so the amber square is the dot rather than a second one. -->
  <text x="80" y="390" font-family="Inter" font-size="112" font-weight="bold" fill="${PAPER}" letter-spacing="-4">Envo\u0131</text>
  <!-- Measured from Inter's own tittle for this size and tracking, so the
       square sits exactly where the dot it replaces would have been. -->
  <rect x="340" y="304" width="18" height="18" rx="5" fill="${AMBER}"/>
  <text x="80" y="452" font-family="Inter" font-size="30" font-weight="bold" fill="${AMBER}" letter-spacing="5">EMAIL SIGNATURE GENERATOR</text>
  <text x="80" y="536" font-family="Inter" font-size="28" font-weight="bold" fill="#9a9389">Free &amp; open source — no login, nothing leaves your browser</text>
</svg>`;
writeFileSync(resolve(root, 'public/og.png'), render(og, 1200));

console.log('Generated the favicon, the app icons and og.png from src/data/brandMark.json.');
