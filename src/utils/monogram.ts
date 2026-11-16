/**
 * A brand mark drawn with markup instead of an image.
 *
 * The project's oldest limitation is that an uploaded logo is embedded as a
 * data URI, which Gmail, Outlook and Yahoo strip — so it shows in the preview
 * and never arrives. The documented fix is to host the file somewhere public
 * and paste the URL, which many people have nowhere to do.
 *
 * Initials in a colored circle need no image at all: a painted table cell,
 * about 300 bytes, that every client renders. Outlook's Word engine ignores
 * border-radius, so it gets a VML oval through an MSO conditional comment —
 * the same technique the call-to-action button already uses.
 */

import type { SignatureData } from '../types';
import { esc, fontStack, logoAlt, renderLogo } from './templateHelpers';
import { readableTextOn } from './color';

/** Initials longer than this stop reading as a monogram. */
export const MONOGRAM_MAX_CHARS = 3;

/**
 * Words are split on whitespace alone. Punctuation inside a name belongs to
 * it: "Doe-Smith" and "O'Brien" are one surname each, so "Jane Doe-Smith" is
 * JD and "Seán O'Brien" is SO — which is what people write themselves.
 */
const WORD_SPLIT = /\s+/u;

/** The first letter of a word, when it starts with one. */
function firstLetter(word: string): string {
  const letter = [...word][0];
  return letter && /\p{L}/u.test(letter) ? letter : '';
}

/**
 * Initials for a name: the first letter of the first and last words, so
 * "Alex Rivera" gives AR and "Maria de la Cruz" gives MC. A single word gives
 * one letter rather than two from the same word. Words that do not start with
 * a letter are skipped, so "🚀 Jane Doe" is still JD. `\p{L}` is the test for
 * a letter, not A-Z, so names in any script work.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(WORD_SPLIT).filter((word) => firstLetter(word));
  if (!words.length) return '';
  const first = firstLetter(words[0]!);
  const last = words.length > 1 ? firstLetter(words[words.length - 1]!) : '';
  return (first + last).toLocaleUpperCase();
}

interface MonogramSource {
  monogramText: string;
  fullName: string;
  company: string;
}

/**
 * What the monogram should read: the person's own override if they typed one,
 * otherwise their initials, otherwise the company's. Returns '' when there is
 * nothing to draw, so a template can leave the space empty rather than show a
 * blank circle.
 */
export function monogramLetters(data: MonogramSource): string {
  const override = data.monogramText.trim();
  if (override) return [...override].slice(0, MONOGRAM_MAX_CHARS).join('').toLocaleUpperCase();
  return initialsOf(data.fullName) || initialsOf(data.company);
}

export interface MonogramOptions {
  /** Diameter in px. Matches the width a logo would have occupied. */
  size: number;
  /** Circle fill. */
  background: string;
  /** Letter color; defaults to whichever of black or white reads on `background`. */
  color?: string;
  /** The font family name (not a stack); passed through `fontStack`. */
  font: string;
  /** Border, e.g. '2px solid #fff', for a mark sitting on a similar color. */
  border?: string;
}

/**
 * Render the monogram, or '' when there are no letters to show.
 *
 * Both branches are sized in px with width/height attributes as well as CSS,
 * because Outlook sizes a cell from the attributes and ignores the rest.
 */
export function renderMonogram(letters: string, { size, background, color, font, border }: MonogramOptions): string {
  const text = letters.trim();
  if (!text) return '';
  const safeText = esc(text);
  const bg = esc(background);
  const fg = esc(color ?? readableTextOn(background));
  const stack = fontStack(font);
  // Two letters at 40% of the diameter fill it without touching the edges;
  // three need to be smaller to fit.
  const fontSize = Math.round(size * ([...text].length > 2 ? 0.32 : 0.4));
  const borderCss = border ? ` border: ${esc(border)};` : '';

  return `<div>
  <!--[if mso]>
  <v:oval xmlns:v="urn:schemas-microsoft-com:vml" style="width:${size}px;height:${size}px;" fillcolor="${bg}" stroked="f">
    <v:textbox inset="0,0,0,0">
      <center style="color:${fg};font-family:${stack};font-size:${fontSize}px;font-weight:bold;">${safeText}</center>
    </v:textbox>
  </v:oval>
  <![endif]-->
  <!--[if !mso]><!-->
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
    <tr>
      <td width="${size}" height="${size}" align="center" bgcolor="${bg}" style="width: ${size}px; height: ${size}px; text-align: center; vertical-align: middle; background-color: ${bg}; color: ${fg}; font-family: ${stack}; font-size: ${fontSize}px; font-weight: bold; line-height: ${size}px; border-radius: 50%;${borderCss}">${safeText}</td>
    </tr>
  </table>
  <!--<![endif]-->
</div>`;
}

export interface BrandMarkOptions {
  /** Width in px for a logo image, which is typically a wide wordmark. */
  width: number;
  /** Diameter in px for a monogram; defaults to `width`. A disc that matches a wordmark's width dominates the layout. */
  monogramSize?: number;
  /** Extra CSS for the logo image only, e.g. a border radius. */
  logoStyle?: string;
  /** Circle fill for the monogram. Pass the raw color: it is escaped here. */
  background: string;
  /** Letter color; defaults to black or white, whichever reads on `background`. */
  color?: string;
  /** Border for the monogram circle, for a mark sitting on a similar color. */
  border?: string;
}

/**
 * The signature's brand mark: the logo image, or the monogram when that is
 * what the person chose. Templates call this instead of `renderLogo` so the
 * choice is made in one place, and either answer can be ''.
 */
export function renderBrandMark(data: SignatureData, options: BrandMarkOptions): string {
  if (data.brandMark === 'monogram') {
    return renderMonogram(monogramLetters(data), {
      size: options.monogramSize ?? options.width,
      background: options.background,
      ...(options.color === undefined ? {} : { color: options.color }),
      font: data.fontFamily,
      ...(options.border === undefined ? {} : { border: options.border }),
    });
  }
  return renderLogo(data.logoUrl, { width: options.width, alt: logoAlt(data), style: options.logoStyle ?? '' });
}
