import type { BrandMark, BrandMarkSide, Density, IconStyle, TextDirection } from '../types';

/**
 * Choices offered by the form. The config validator (`parseConfig.ts`)
 * accepts only these, so templates never see an unexpected font or icon
 * style regardless of where the data came from.
 */
export const FONTS = ['Inter', 'Arial', 'Georgia', 'Verdana', 'Trebuchet MS', 'Courier New', 'Times New Roman'] as const;

export type FontFamily = (typeof FONTS)[number];

export function isFont(value: unknown): value is FontFamily {
  return typeof value === 'string' && (FONTS as readonly string[]).includes(value);
}

/**
 * Email-safe font stacks. Recipients rarely have Inter installed, so every
 * option ends in fonts that ship with Windows and macOS plus a generic family.
 * Multi-word names are left unquoted (valid CSS) so the stack needs no escaping.
 */
export const FONT_STACKS: Record<FontFamily, string> = {
  Inter: 'Inter, Helvetica, Arial, sans-serif',
  Arial: 'Arial, Helvetica, sans-serif',
  Georgia: 'Georgia, Times New Roman, Times, serif',
  Verdana: 'Verdana, Geneva, sans-serif',
  'Trebuchet MS': 'Trebuchet MS, Helvetica, Arial, sans-serif',
  'Courier New': 'Courier New, Courier, monospace',
  'Times New Roman': 'Times New Roman, Times, serif',
};

export const ICON_STYLES = ['brand', 'dark', 'light', 'gray'] as const satisfies readonly IconStyle[];

export const ICON_STYLE_OPTIONS: { value: IconStyle; label: string }[] = [
  { value: 'brand', label: 'Brand colors' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light (for dark backgrounds)' },
  { value: 'gray', label: 'Gray' },
];

export function isIconStyle(value: unknown): value is IconStyle {
  return typeof value === 'string' && (ICON_STYLES as readonly string[]).includes(value);
}

export const BRAND_MARKS = ['logo', 'monogram'] as const satisfies readonly BrandMark[];

export const BRAND_MARK_OPTIONS: { value: BrandMark; label: string; hint: string }[] = [
  { value: 'logo', label: 'Logo image', hint: 'A hosted image URL, or a file (which most clients strip)' },
  { value: 'monogram', label: 'Monogram', hint: 'Your initials in a circle — needs no hosting, shows everywhere' },
];

export function isBrandMark(value: unknown): value is BrandMark {
  return typeof value === 'string' && (BRAND_MARKS as readonly string[]).includes(value);
}

export const TEXT_DIRECTIONS = ['ltr', 'rtl'] as const satisfies readonly TextDirection[];

export const TEXT_DIRECTION_OPTIONS: { value: TextDirection; label: string }[] = [
  { value: 'ltr', label: 'Left to right' },
  { value: 'rtl', label: 'Right to left (Arabic, Hebrew)' },
];

export function isTextDirection(value: unknown): value is TextDirection {
  return typeof value === 'string' && (TEXT_DIRECTIONS as readonly string[]).includes(value);
}

export const DENSITIES = ['comfortable', 'compact'] as const satisfies readonly Density[];

export const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
];

export function isDensity(value: unknown): value is Density {
  return typeof value === 'string' && (DENSITIES as readonly string[]).includes(value);
}

/** How much of the original spacing a compact signature keeps. */
export const COMPACT_SPACING = 0.6;

export const BRAND_MARK_SIDES = ['start', 'end'] as const satisfies readonly BrandMarkSide[];

export const BRAND_MARK_SIDE_OPTIONS: { value: BrandMarkSide; label: string }[] = [
  { value: 'start', label: 'Before your name' },
  { value: 'end', label: 'After your name' },
];

export function isBrandMarkSide(value: unknown): value is BrandMarkSide {
  return typeof value === 'string' && (BRAND_MARK_SIDES as readonly string[]).includes(value);
}

/**
 * Upper bounds applied to every imported, shared or stored config. The form
 * mirrors these with `maxLength` so typed and imported data obey the same
 * limits.
 */
export const LIMITS = {
  /** Name, title, company, phone, email, button label and similar. */
  text: 200,
  address: 300,
  disclaimer: 600,
  /** Website, booking link, CTA link and social handles or URLs. */
  url: 2048,
  /** Uploaded logos are base64 data URLs; ~1.5 MB is a generous ceiling. */
  logoUrl: 1_500_000,
  /** The name a person gives a saved signature. */
  signatureName: 60,
  /** Monogram letters; more than three stops reading as a monogram. */
  monogramText: 3,
} as const;

/**
 * How many signatures one browser may keep. localStorage is only a few
 * megabytes and an uploaded logo can be 1.5 MB on its own, so the ceiling is
 * low on purpose — see LIMITS.logoUrl.
 */
export const MAX_SIGNATURES = 10;
