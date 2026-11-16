/**
 * The monogram as a PNG.
 *
 * The monogram itself is markup, which is the point of it — it needs no
 * hosting and nothing can strip it. But some signature editors only accept an
 * image where a picture goes (and a profile photo field takes nothing else),
 * so the same mark is offered as a file. Drawn here in the browser, like the
 * QR code: nothing is sent anywhere.
 */

import { readableTextOn } from './color';

export interface MonogramPngOptions {
  /** Width and height in px. 512 is big enough for a retina avatar. */
  size?: number;
  background: string;
  /** Letter color; defaults to whichever of black or white reads on the circle. */
  color?: string;
  /** Font family for the letters, as a CSS font stack. */
  font?: string;
}

/**
 * Draw the monogram and return it as a PNG blob. Rejects rather than handing
 * back a blank image when the canvas is unavailable.
 */
export async function monogramPngBlob(
  letters: string,
  { size = 512, background, color, font = 'Helvetica, Arial, sans-serif' }: MonogramPngOptions,
): Promise<Blob> {
  const text = letters.trim();
  if (!text) throw new Error('There are no initials to draw yet.');

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not draw the monogram.');

  const radius = size / 2;
  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2);
  ctx.fill();

  // The same proportions the markup version uses, so the two look alike.
  ctx.fillStyle = color ?? readableTextOn(background);
  ctx.font = `bold ${Math.round(size * ([...text].length > 2 ? 0.32 : 0.4))}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, radius, radius);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Your browser could not export the monogram.');
  return blob;
}

/** A filename for the monogram, e.g. `ar-monogram.png`. */
export function monogramFilename(letters: string): string {
  const slug = letters
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 8);
  return `${slug || 'monogram'}-monogram.png`;
}
