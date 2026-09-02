import type { IconStyle } from '../types';

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
} as const;
