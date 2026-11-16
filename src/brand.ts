/**
 * Envoi's identity, in one place.
 *
 * *Envoi* (n.) — the closing stanza of a ballade, addressed to whoever the
 * poem is being sent to. Literally "the sending": the words at the end that
 * see a message on its way, which is what a signature is.
 *
 * The mark is the signature block drawn as a letter and stamped into a seal:
 * an E whose three arms are a name line, a title line and a contact line, so
 * they are deliberately different lengths. The geometry is in
 * `data/brandMark.json`, shared with the asset generator so the favicon, the
 * app icons and the header cannot drift apart — the problem the old identity
 * had, with four different blues across three files and an emoji character
 * standing in for a favicon.
 */

import mark from './data/brandMark.json';

/** The whole palette. Three colors, no gradients: it has to stamp and emboss. */
export const BRAND = {
  /** Near-black with a touch of warmth, for surfaces and the letter. */
  ink: '#14110E',
  /** The seal. The only accent the identity has. */
  amber: '#E9A23B',
  /** Unbleached paper, for the letter knocked out of a dark seal. */
  paper: '#F7F2E8',
} as const;

export type BrandColor = keyof typeof BRAND;

export interface MarkColors {
  /** Behind everything; omit for a free-standing mark with no tile. */
  background?: string;
  /** The seal. */
  seal: string;
  /** The letter cut out of it. */
  letter: string;
}

export type MarkVariant = 'dark' | 'light' | 'bare';

/**
 * The named ways the mark is allowed to be colored. Typed as MarkColors
 * rather than inferred, so `background` stays optional on every variant
 * instead of vanishing from the union for the one that has none.
 */
export const MARK_VARIANTS: Record<MarkVariant, MarkColors> = {
  /** On a dark tile: the default app icon. */
  dark: { background: BRAND.ink, seal: BRAND.amber, letter: BRAND.ink },
  /** On a light tile. */
  light: { background: BRAND.paper, seal: BRAND.amber, letter: BRAND.ink },
  /** No tile, for placing on a surface that is already the right color. */
  bare: { seal: BRAND.amber, letter: BRAND.ink },
};

export const BRAND_NAME = 'Envoi';
export const BRAND_TAGLINE = 'Email signature generator';
export const BRAND_DESCRIPTION =
  'Build a professional email signature in your browser — free, open source, no login, no tracking.';

/** The mark's geometry, as both consumers read it. */
export const markGeometry = mark;
