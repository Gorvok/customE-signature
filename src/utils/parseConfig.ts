import type { IconStyle, SignatureData } from '../types';
import type { SharedConfig } from './shareConfig';
import { defaultData } from '../data/defaults';
import { socialPlatforms } from '../data/socialPlatforms';
import { templates } from '../templates';
import { LIMITS, isFont, isIconStyle } from '../data/options';

/**
 * The single entry point for untrusted signature data: share links, imported
 * JSON files and localStorage all pass through here before reaching state.
 * Every field is coerced to its expected type, enum values fall back to the
 * defaults, and lengths are capped. Unknown keys are dropped.
 */

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const PLATFORM_IDS: readonly string[] = socialPlatforms.map((p) => p.id);
/** Schemes the image sanitizer will render; anything else is dropped here. */
const IMAGE_URL = /^(https?:\/\/|data:image\/)/i;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number, fallback: string): string {
  return typeof value === 'string' ? value.slice(0, max) : fallback;
}

function color(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback;
}

function font(value: unknown, fallback: string): string {
  return isFont(value) ? value : fallback;
}

function iconStyle(value: unknown, fallback: IconStyle): IconStyle {
  return isIconStyle(value) ? value : fallback;
}

function logoUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > LIMITS.logoUrl) return '';
  const trimmed = value.trim();
  // Allow partial input like "example.com/logo.png" (the image sanitizer
  // gates rendering), but drop anything with an explicit non-image scheme.
  if (HAS_SCHEME.test(trimmed) && !IMAGE_URL.test(trimmed)) return '';
  return value;
}

function socials(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const out: Record<string, string> = {};
  for (const id of PLATFORM_IDS) {
    if (!Object.hasOwn(value, id)) continue;
    const entry = value[id];
    if (typeof entry === 'string') out[id] = entry.slice(0, LIMITS.url);
  }
  return out;
}

function socialOrder(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of value) {
    if (typeof id === 'string' && PLATFORM_IDS.includes(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/** Coerce anything into a well-formed SignatureData, using `defaults` for missing or invalid fields. */
export function parseSignatureData(input: unknown, defaults: SignatureData = defaultData): SignatureData {
  const src: Record<string, unknown> = isRecord(input) ? input : {};
  return {
    fullName: text(src.fullName, LIMITS.text, defaults.fullName),
    pronouns: text(src.pronouns, LIMITS.text, defaults.pronouns),
    jobTitle: text(src.jobTitle, LIMITS.text, defaults.jobTitle),
    department: text(src.department, LIMITS.text, defaults.department),
    company: text(src.company, LIMITS.text, defaults.company),
    phone: text(src.phone, LIMITS.text, defaults.phone),
    email: text(src.email, LIMITS.text, defaults.email),
    website: text(src.website, LIMITS.url, defaults.website),
    address: text(src.address, LIMITS.address, defaults.address),
    bookingLink: text(src.bookingLink, LIMITS.url, defaults.bookingLink),
    socials: socials(src.socials),
    socialOrder: socialOrder(src.socialOrder, defaults.socialOrder),
    logoUrl: logoUrl(src.logoUrl),
    ctaLabel: text(src.ctaLabel, LIMITS.text, defaults.ctaLabel),
    ctaUrl: text(src.ctaUrl, LIMITS.url, defaults.ctaUrl),
    disclaimer: text(src.disclaimer, LIMITS.disclaimer, defaults.disclaimer),
    primaryColor: color(src.primaryColor, defaults.primaryColor),
    secondaryColor: color(src.secondaryColor, defaults.secondaryColor),
    fontFamily: font(src.fontFamily, defaults.fontFamily),
    iconStyle: iconStyle(src.iconStyle, defaults.iconStyle),
  };
}

/**
 * Validate a decoded share link or imported file. Returns null when there is
 * no data object at all; otherwise the data is coerced and the template id is
 * kept only if it names a real template.
 */
export function parseSharedConfig(input: unknown): SharedConfig | null {
  if (!isRecord(input) || !isRecord(input.data)) return null;
  const data = parseSignatureData(input.data);
  const templateId = input.templateId;
  if (typeof templateId === 'string' && templates.some((t) => t.id === templateId)) {
    return { data, templateId };
  }
  return { data };
}
