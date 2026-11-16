// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { monogramFilename, monogramPngBlob } from './monogramImage';

describe('monogramFilename', () => {
  it('names the file after the letters', () => {
    expect(monogramFilename('AR')).toBe('ar-monogram.png');
    expect(monogramFilename(' nw ')).toBe('nw-monogram.png');
  });

  it('falls back when the letters give nothing a filesystem wants', () => {
    expect(monogramFilename('ليلى')).toBe('monogram-monogram.png');
    expect(monogramFilename('')).toBe('monogram-monogram.png');
  });
});

describe('monogramPngBlob', () => {
  it('refuses rather than drawing an empty circle', async () => {
    await expect(monogramPngBlob('   ', { background: '#0f172a' })).rejects.toThrow(/no initials/i);
  });

  it('says so when the browser cannot draw, rather than returning a blank image', async () => {
    // jsdom has no canvas, which is the same failure a locked-down browser gives.
    await expect(monogramPngBlob('AR', { background: '#0f172a' })).rejects.toThrow(/could not/i);
  });
});
