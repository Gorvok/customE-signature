// Rasterizes the social SVGs (src/data/socialIconSvgs.json) into hosted PNGs.
// Generated email signatures reference these PNGs because Gmail and Outlook
// strip inline/data-URI SVGs. Run with: npm run generate:icons
//
// Output: public/icons/png/<style>/<platform>.png
//   - brand: each platform in its official color
//   - dark / light / gray: all platforms in a single neutral color
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svgs = JSON.parse(readFileSync(resolve(root, 'src/data/socialIconSvgs.json'), 'utf8'));

const RENDER_SIZE = 64; // square; downscaled by the browser/email client

const brandColors = {
  website: '#4B5563',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  facebook: '#1877F2',
  twitter: '#000000',
  github: '#181717',
  youtube: '#FF0000',
  tiktok: '#000000',
};

const styleColors = {
  dark: '#1A1A1A',
  light: '#FFFFFF',
  gray: '#9CA3AF',
};

function rasterize(svg, color) {
  const colored = svg.replace(/__COLOR__/g, color);
  const resvg = new Resvg(colored, { fitTo: { mode: 'width', value: RENDER_SIZE } });
  return resvg.render().asPng();
}

let count = 0;
for (const [platform, svg] of Object.entries(svgs)) {
  // Brand style: per-platform color.
  const brandDir = resolve(root, 'public/icons/png/brand');
  mkdirSync(brandDir, { recursive: true });
  writeFileSync(resolve(brandDir, `${platform}.png`), rasterize(svg, brandColors[platform] ?? '#4B5563'));
  count++;

  // Single-color styles.
  for (const [style, color] of Object.entries(styleColors)) {
    const dir = resolve(root, `public/icons/png/${style}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, `${platform}.png`), rasterize(svg, color));
    count++;
  }
}

console.log(`Generated ${count} PNG icons in public/icons/png/`);
