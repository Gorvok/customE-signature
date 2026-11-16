import { describe, expect, it } from 'vitest';
import { BRAND, BRAND_NAME, MARK_VARIANTS, markGeometry } from './brand';
// The generator's source as text: it is a plain Node script, so the only way
// to assert it agrees with this module is to read what it says.
import generator from '../scripts/generate-brand.mjs?raw';

describe('the palette', () => {
  it('is three colors, all hex', () => {
    expect(Object.keys(BRAND)).toEqual(['ink', 'amber', 'paper']);
    for (const [name, value] of Object.entries(BRAND)) {
      expect(value, name).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('is the same palette the asset generator writes into the files', () => {
    // The generator is a plain Node script and cannot import this module, so
    // it keeps its own copy. This is what stops the two drifting — which is
    // exactly how the identity it replaced ended up with four different blues.
    expect(generator).toContain(`const INK = '${BRAND.ink}'`);
    expect(generator).toContain(`const AMBER = '${BRAND.amber}'`);
    expect(generator).toContain(`const PAPER = '${BRAND.paper}'`);
  });

  it('keeps the letter readable on the seal', () => {
    // The mark is a letter knocked out of a disc; if those two ever converge
    // the mark disappears rather than looking wrong.
    for (const [name, variant] of Object.entries(MARK_VARIANTS)) {
      expect(variant.seal, name).not.toBe(variant.letter);
    }
  });
});

describe('the mark geometry', () => {
  const { seal, letter, viewBox } = markGeometry;
  const [, , width, height] = viewBox.split(' ').map(Number);

  it('is a square canvas with the seal centred in it', () => {
    expect(width).toBe(height);
    expect(seal.cx).toBe(width! / 2);
    expect(seal.cy).toBe(height! / 2);
  });

  it('keeps the seal inside the canvas', () => {
    expect(seal.cx - seal.r).toBeGreaterThanOrEqual(0);
    expect(seal.cx + seal.r).toBeLessThanOrEqual(width!);
  });

  it('draws an E: a spine and three arms', () => {
    expect(letter.map((bar) => bar.role)).toEqual(['spine', 'name', 'title', 'contact']);
    const spine = letter[0]!;
    expect(spine.height).toBeGreaterThan(spine.width);
    for (const arm of letter.slice(1)) expect(arm.width).toBeGreaterThan(arm.height);
  });

  it('gives the arms the lengths of a signature block, which is the whole idea', () => {
    const [, name, title, contact] = letter;
    // Name longest, title shortest, contact in between — three different
    // lengths, or it is just a letter rather than a signature block.
    expect(name!.width).toBeGreaterThan(contact!.width);
    expect(contact!.width).toBeGreaterThan(title!.width);
  });

  it('keeps every bar of the letter inside the seal', () => {
    for (const bar of letter) {
      for (const [x, y] of [
        [bar.x, bar.y],
        [bar.x + bar.width, bar.y],
        [bar.x, bar.y + bar.height],
        [bar.x + bar.width, bar.y + bar.height],
      ]) {
        const distance = Math.hypot(x! - seal.cx, y! - seal.cy);
        expect(distance, `${bar.role} corner (${x}, ${y})`).toBeLessThanOrEqual(seal.r);
      }
    }
  });

  it('is the geometry the generator draws from, not a second copy', () => {
    expect(generator).toContain("readFileSync(resolve(root, 'src/data/brandMark.json')");
  });
});

describe('the wordmark’s dot', () => {
  // Placed by eye twice, wrong twice — it sat over the "o". These numbers are
  // measured from Inter Bold's own tittle at this size and tracking, so if the
  // size, the tracking or the font changes, re-measure rather than nudge.
  it('is drawn where the font puts the dot it replaces', () => {
    expect(generator).toContain('<rect x="340" y="304" width="18" height="18" rx="5"');
  });

  it('is only drawn because the letter beneath it has no dot of its own', () => {
    expect(generator).toContain('Envo\\u0131');
    expect(generator).not.toMatch(/>Envoi</);
  });
});

describe('the name', () => {
  it('is used by the app and the generated assets alike', () => {
    expect(BRAND_NAME).toBe('Envoi');
    expect(generator).toContain('Envo\\u0131');
  });
});
