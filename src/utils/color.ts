/**
 * Color math for readability checks (WCAG 2.1 relative luminance and
 * contrast ratio).
 *
 * Signature colors are chosen by the person using the app, and a mail client
 * in dark mode may paint a background we never picked, so "is this text
 * readable?" is a question both the templates and the UI have to answer.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** WCAG's threshold for body text (and anything smaller). */
export const AA_CONTRAST = 4.5;

/** WCAG's threshold for large or bold text (18pt / 14pt bold and up). */
export const AA_LARGE_CONTRAST = 3;

/**
 * What a dark-mode client paints behind content that declares no background
 * of its own. Apple Mail, Outlook for Mac and Gmail's dark themes all land
 * near this; it is the lightest of them, so a check against it is the
 * forgiving one.
 */
export const DARK_CLIENT_BG = '#1f1f1f';

/** The background every other client paints: a white message body. */
export const LIGHT_CLIENT_BG = '#ffffff';

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * Parse `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` into channel values.
 * Alpha is parsed and discarded: it cannot be resolved without knowing what
 * is behind it, and the templates never emit it. Returns null for anything
 * else (a keyword, `currentColor`, a gradient), so callers can skip rather
 * than guess.
 */
export function parseHexColor(value: string): Rgb | null {
  const hex = value.trim();
  if (!HEX.test(hex)) return null;
  const body = hex.slice(1);
  const short = body.length === 3 || body.length === 4;
  const pair = (i: number) => (short ? body[i]!.repeat(2) : body.slice(i * 2, i * 2 + 2));
  return {
    r: parseInt(pair(0), 16),
    g: parseInt(pair(1), 16),
    b: parseInt(pair(2), 16),
  };
}

/** A single channel, linearized as WCAG defines it. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * WCAG contrast ratio between two colors, 1 (identical) to 21 (black on
 * white). Returns null when either color is not a hex value we can read,
 * which the caller should treat as "unknown", never as "fine".
 */
export function contrastRatio(a: string, b: string): number | null {
  const first = parseHexColor(a);
  const second = parseHexColor(b);
  if (!first || !second) return null;
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

/** True when `fg` on `bg` meets `min`. Unknown colors are not reported as failures. */
export function meetsContrast(fg: string, bg: string, min = AA_CONTRAST): boolean {
  const ratio = contrastRatio(fg, bg);
  return ratio === null || ratio >= min;
}

/** "4.83:1", for a UI readout. */
export function formatContrast(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Whether a background counts as dark, i.e. whether light text belongs on
 * it. The midpoint is the luminance at which white and black text are
 * equally readable (~0.18 on the WCAG curve).
 */
export function isDarkColor(value: string): boolean {
  const rgb = parseHexColor(value);
  return rgb !== null && relativeLuminance(rgb) < 0.18;
}

/**
 * Black or white, whichever is more readable on `background`. Used for text
 * the app places on a color the person chose.
 */
export function readableTextOn(background: string): '#ffffff' | '#000000' {
  return isDarkColor(background) ? '#ffffff' : '#000000';
}
