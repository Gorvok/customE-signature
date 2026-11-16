import { describe, expect, it } from 'vitest';
import {
  AA_CONTRAST,
  DARK_CLIENT_BG,
  LIGHT_CLIENT_BG,
  contrastRatio,
  formatContrast,
  isDarkColor,
  meetsContrast,
  parseHexColor,
  readableTextOn,
  relativeLuminance,
} from './color';

describe('parseHexColor', () => {
  it('reads the three- and six-digit forms alike', () => {
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor('#0f172a')).toEqual({ r: 15, g: 23, b: 42 });
  });

  it('accepts an alpha channel and ignores it', () => {
    // It cannot be resolved without knowing what is behind it, and the
    // templates never emit one.
    expect(parseHexColor('#1234')).toEqual(parseHexColor('#112233'));
    expect(parseHexColor('#11223344')).toEqual(parseHexColor('#112233'));
  });

  it('returns null for anything it cannot read, rather than guessing', () => {
    for (const value of ['', 'white', 'currentColor', 'rgb(0,0,0)', '#12345', 'fff', '#ggg']) {
      expect(parseHexColor(value), value).toBeNull();
    }
  });
});

describe('relativeLuminance', () => {
  it('anchors at black and white', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 10);
  });

  it('uses the linear segment for very dark channels', () => {
    // Below the 0.03928 knee the curve is a straight division, not a power.
    expect(relativeLuminance({ r: 5, g: 5, b: 5 })).toBeCloseTo(5 / 255 / 12.92, 10);
  });
});

describe('contrastRatio', () => {
  it('matches the known WCAG extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 10);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#6b7280', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#6b7280')!, 10);
  });

  it('places the grays this project used to reach for', () => {
    // The reason MUTED_TEXT exists: these all fail AA for small text on white.
    expect(contrastRatio('#999999', LIGHT_CLIENT_BG)!).toBeLessThan(AA_CONTRAST);
    expect(contrastRatio('#888888', LIGHT_CLIENT_BG)!).toBeLessThan(AA_CONTRAST);
    expect(contrastRatio('#777777', LIGHT_CLIENT_BG)!).toBeLessThan(AA_CONTRAST);
    expect(contrastRatio('#6b7280', LIGHT_CLIENT_BG)!).toBeGreaterThan(AA_CONTRAST);
  });

  it('returns null when either color is unreadable to it', () => {
    expect(contrastRatio('currentColor', '#ffffff')).toBeNull();
    expect(contrastRatio('#ffffff', 'inherit')).toBeNull();
  });

  it('confirms no single color clears AA on both client canvases', () => {
    // The arithmetic behind darkMode.ts: a color light enough for the dark
    // canvas is too light for the white one, and the reverse.
    for (let value = 0; value <= 255; value++) {
      const hex = `#${value.toString(16).padStart(2, '0').repeat(3)}`;
      const onLight = contrastRatio(hex, LIGHT_CLIENT_BG)!;
      const onDark = contrastRatio(hex, DARK_CLIENT_BG)!;
      expect(Math.min(onLight, onDark), hex).toBeLessThan(AA_CONTRAST);
    }
  });
});

describe('meetsContrast', () => {
  it('passes a readable pair and fails an unreadable one', () => {
    expect(meetsContrast('#000000', '#ffffff')).toBe(true);
    expect(meetsContrast('#cccccc', '#ffffff')).toBe(false);
  });

  it('does not report an unknown color as a failure', () => {
    expect(meetsContrast('currentColor', '#ffffff')).toBe(true);
  });

  it('takes the large-text threshold when given one', () => {
    expect(meetsContrast('#949494', '#ffffff')).toBe(false);
    expect(meetsContrast('#949494', '#ffffff', 3)).toBe(true);
  });
});

describe('isDarkColor', () => {
  it('splits backgrounds at the point where white text wins', () => {
    expect(isDarkColor('#0f172a')).toBe(true);
    expect(isDarkColor('#000000')).toBe(true);
    expect(isDarkColor('#ffffff')).toBe(false);
    expect(isDarkColor('#f8f8f8')).toBe(false);
  });

  it('is false for a color it cannot read', () => {
    expect(isDarkColor('transparent')).toBe(false);
  });
});

describe('readableTextOn', () => {
  it('picks white on a dark surface and black on a light one', () => {
    expect(readableTextOn('#0f172a')).toBe('#ffffff');
    expect(readableTextOn('#ffffff')).toBe('#000000');
  });

  it('always returns a pair that clears AA', () => {
    for (const background of ['#0f172a', '#ffffff', '#6b7280', '#f8f8f8', '#2563eb']) {
      expect(contrastRatio(readableTextOn(background), background)!, background).toBeGreaterThan(AA_CONTRAST);
    }
  });
});

describe('formatContrast', () => {
  it('reads as a ratio', () => {
    expect(formatContrast(4.8312)).toBe('4.83:1');
  });
});
