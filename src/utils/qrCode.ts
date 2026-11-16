import { encode } from 'uqr';

/**
 * QR codes, generated here in the browser.
 *
 * Generation is local — nothing is sent to a QR service, so contact details
 * never leave the page. Delivery is the part that cannot be solved here: the
 * result is an image, and an image in a signature has to be hosted, because
 * Gmail, Outlook and Yahoo strip data: URIs (see compatibility.ts).
 *
 * Rendering the code as a table of coloured cells would avoid an image
 * altogether, and was measured rather than assumed: run-length compressed, a
 * short URL comes to ~14 KB of markup and a whole vCard to ~60 KB, against
 * Gmail's ~10,000-character signature allowance. So the QR is offered as a
 * PNG to host, which is the same advice the logo field gives.
 */

/** Black and white modules of the code; `true` is a dark module. */
export function qrMatrix(text: string): boolean[][] {
  const { data } = encode(text, { ecc: 'M', border: 2 });
  return data.map((row) => [...row]);
}

export interface QrPngOptions {
  /** Pixels per module. */
  scale?: number;
  dark?: string;
  light?: string;
}

/**
 * Draw the code to a canvas and return it as a PNG blob. Rejects rather than
 * returning a blank image when the canvas is unavailable.
 */
export async function qrPngBlob(text: string, { scale = 8, dark = '#000000', light = '#ffffff' }: QrPngOptions = {}): Promise<Blob> {
  const matrix = qrMatrix(text);
  const size = matrix.length * scale;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not draw the QR code.');

  ctx.fillStyle = light;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = dark;
  matrix.forEach((row, y) => {
    row.forEach((on, x) => {
      if (on) ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Your browser could not export the QR code.');
  return blob;
}
