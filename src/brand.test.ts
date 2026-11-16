import { describe, expect, it } from 'vitest';
import { BRAND, BRAND_NAME, MARK_VARIANTS, markGeometry } from './brand';
// The generator's source as text: it is a plain Node script, so the only way
// to assert it agrees with this module is to read what it says.
import generator from '../scripts/generate-brand.mjs?raw';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AA_CONTRAST, AA_LARGE_CONTRAST, contrastRatio, parseHexColor } from './utils/color';

// Read from disk rather than with `?raw`: Vite's CSS pipeline intercepts a raw
// import of a stylesheet and hands the test an empty string, so every assertion
// against it would quietly pass while checking nothing.
const css = readFileSync(resolve(__dirname, 'index.css'), 'utf8');

/** Every component's source, so the suite can assert what the UI does not contain. */
const components = import.meta.glob('./components/*.tsx', { eager: true, query: '?raw', import: 'default' });

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

describe('the accent tokens', () => {
  // The accent is split by theme because neither brand color works alone: ink
  // vanishes on a dark page, and brand amber on white is 2.17:1. These pairings
  // were computed, not chosen by eye, so they are pinned here — a "nicer"
  // amber that drops accent text below 4.5:1 should fail the suite, not ship.
  const token = (block: 'root' | 'dark', name: string) => {
    const scope = block === 'root' ? ':root' : '\\.dark';
    const body = new RegExp(`${scope} \\{([^}]*)\\}`).exec(css)?.[1] ?? '';
    const value = new RegExp(`--${name}:\\s*([^;]+);`).exec(body)?.[1];
    if (!value) throw new Error(`no --${name} in ${block}`);
    return value.trim();
  };

  /** Flatten `rgb(r g b / a)` over an opaque backdrop so it can be measured. */
  const flatten = (value: string, backdrop: string) => {
    const parts = /rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/.exec(value);
    if (!parts) return value;
    const alpha = Number(parts[4]);
    const under = parseHexColor(backdrop);
    if (!under) throw new Error(`bad backdrop ${backdrop}`);
    const mix = (fg: number, bg: number) => Math.round(fg * alpha + bg * (1 - alpha));
    const hex = [
      mix(Number(parts[1]), under.r),
      mix(Number(parts[2]), under.g),
      mix(Number(parts[3]), under.b),
    ]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('');
    return `#${hex}`;
  };

  const atLeast = (fg: string, bg: string, min: number, label: string) => {
    const ratio = contrastRatio(fg, bg);
    expect(ratio, `${label} (${fg} on ${bg})`).not.toBeNull();
    expect(ratio!, `${label} (${fg} on ${bg})`).toBeGreaterThanOrEqual(min);
  };

  const WHITE = '#ffffff';
  const GRAY_900 = '#111827';

  it('carries button text in light mode', () => {
    atLeast(token('root', 'accent-fg'), token('root', 'accent'), AA_CONTRAST, 'light button');
    atLeast(token('root', 'accent-fg'), token('root', 'accent-hover'), AA_CONTRAST, 'light hover');
  });

  it('carries button text in dark mode', () => {
    atLeast(token('dark', 'accent-fg'), token('dark', 'accent'), AA_CONTRAST, 'dark button');
    atLeast(token('dark', 'accent-fg'), token('dark', 'accent-hover'), AA_CONTRAST, 'dark hover');
  });

  it('carries accent text on the page and on its own tinted surface', () => {
    atLeast(token('root', 'accent-text'), WHITE, AA_CONTRAST, 'light link on page');
    atLeast(token('root', 'accent-text'), token('root', 'accent-surface'), AA_CONTRAST, 'light link on surface');
    atLeast(token('dark', 'accent-text'), GRAY_900, AA_CONTRAST, 'dark link on page');
    atLeast(
      token('dark', 'accent-text'),
      flatten(token('dark', 'accent-surface'), GRAY_900),
      AA_CONTRAST,
      'dark link on surface',
    );
  });

  it('draws a focus ring that is visible against the page', () => {
    // A ring is a non-text indicator, so 3:1 is the bar it has to clear.
    atLeast(token('root', 'accent-ring'), WHITE, AA_LARGE_CONTRAST, 'light ring');
    atLeast(token('dark', 'accent-ring'), GRAY_900, AA_LARGE_CONTRAST, 'dark ring');
  });

  it('is built from the brand palette rather than a fourth color', () => {
    expect(token('root', 'accent')).toBe(BRAND.ink);
    expect(token('dark', 'accent')).toBe(BRAND.amber);
    expect(token('dark', 'accent-fg')).toBe(BRAND.ink);
  });

  it('is what the interface actually uses, with no blue left from the old identity', () => {
    // The identity this replaced was four different blues in three files. The
    // point of the swap was to end that, so the absence is worth asserting.
    expect(css).not.toMatch(/#3b82f6/i);
    for (const [path, source] of Object.entries(components)) {
      expect(source, path).not.toMatch(/\bblue-\d/);
    }
  });
});
