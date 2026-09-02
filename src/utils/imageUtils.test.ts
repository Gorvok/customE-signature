import { describe, expect, it } from 'vitest';
import { checkImageFile, fileToBase64, MAX_IMAGE_BYTES } from './imageUtils';

describe('checkImageFile', () => {
  it('rejects files that are not images', () => {
    expect(checkImageFile(new File(['x'], 'notes.txt', { type: 'text/plain' }))).toMatch(/not an image/);
    expect(checkImageFile(new File(['x'], 'page.html', { type: 'text/html' }))).toMatch(/not an image/);
  });

  it('rejects images over the byte cap', () => {
    const big = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'big.png', { type: 'image/png' });
    expect(checkImageFile(big)).toMatch(/under 5 MB/);
  });

  it('accepts an image under the cap', () => {
    expect(checkImageFile(new File(['x'], 'logo.png', { type: 'image/png' }))).toBeNull();
    expect(checkImageFile(new File([new Uint8Array(MAX_IMAGE_BYTES)], 'max.png', { type: 'image/png' }))).toBeNull();
  });
});

describe('fileToBase64', () => {
  it('rejects before reading when the file fails the checks', async () => {
    await expect(fileToBase64(new File(['x'], 'notes.txt', { type: 'text/plain' }))).rejects.toThrow(/not an image/);
    const big = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'big.png', { type: 'image/png' });
    await expect(fileToBase64(big)).rejects.toThrow(/under 5 MB/);
  });
});
