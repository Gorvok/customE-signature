import { socialPlatforms } from '../data/socialPlatforms';
import type { IconStyle } from '../types';

/**
 * Absolute URL of the deployed hosted icons. Generated signatures must use
 * absolute URLs so the icons resolve once pasted into any email client.
 * Keep in sync with `base` in vite.config.ts.
 */
export const PRODUCTION_ICON_BASE = 'https://gorvok.github.io/customE-signature/icons/png';

/** Local URL for the live preview (resolves from /public before deploy). */
export const LOCAL_ICON_BASE = `${import.meta.env.BASE_URL}icons/png`;

/**
 * Escape a string for safe interpolation into HTML text content OR a
 * double-quoted HTML attribute value. Templates feed their output through
 * `dangerouslySetInnerHTML` and the clipboard, so every piece of
 * user-controlled data must pass through here first.
 */
export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Short alias used throughout the templates. */
export const esc = escapeHtml;

/**
 * Sanitize a URL destined for an `href`. Only http(s), mailto and tel
 * schemes are allowed through; anything with another scheme (e.g.
 * `javascript:`) is neutralized to `#`. The result is HTML-escaped so it is
 * safe inside a double-quoted attribute.
 */
export function sanitizeLinkUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return escapeHtml(trimmed);
  // Has some other explicit scheme -> reject.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return '#';
  // Scheme-relative or relative URL -> keep as-is (escaped).
  return escapeHtml(trimmed);
}

/**
 * Sanitize a URL destined for an `<img src>`. Allows http(s) and
 * `data:image/...` (logos are uploaded as base64 data URIs). Everything else
 * is dropped.
 */
export function sanitizeImageUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:\/\/|data:image\/)/i.test(trimmed)) return escapeHtml(trimmed);
  return '';
}

/** Ensure a website URL has a protocol so links work when pasted into email. */
export function normalizeWebsite(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Strip the protocol for display purposes. */
export function displayWebsite(url: string): string {
  return url.replace(/^https?:\/\//i, '');
}

/** Reduce a phone number to digits/`+` for a `tel:` href. */
export function telDigits(phone: string): string {
  return phone.replace(/[^+\d]/g, '');
}

/** Build the full URL for a social handle (or pass through a full URL). */
export function buildSocialUrl(platformId: string, value: string): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const platform = socialPlatforms.find((p) => p.id === platformId);
  if (!platform || !platform.urlPrefix) return value;
  return platform.urlPrefix + value;
}

/**
 * Harden generated markup for email clients: give every `<table>` a
 * presentation role so screen readers and Outlook treat it as layout, not data.
 */
export function finalizeHtml(html: string): string {
  return html.replace(/<table(?![^>]*\brole=)/g, '<table role="presentation"');
}

/** A combined "Job Title, Department" line (either part may be empty). */
export function roleLine(jobTitle: string, department: string): string {
  return [jobTitle, department].filter((p) => p.trim()).map(esc).join(', ');
}

interface CtaOptions {
  bg: string;
  fg: string;
  font: string;
}

/**
 * Render a "bulletproof" call-to-action button, or '' when not configured.
 * Outlook (Word engine) ignores padding/border-radius on links, so it gets a
 * VML <v:roundrect> via an MSO conditional comment; every other client gets the
 * styled inline-block <a>. Browsers render the non-MSO branch in the preview.
 */
export function renderCtaButton(label: string, url: string, { bg, fg, font }: CtaOptions): string {
  if (!label.trim() || !url.trim()) return '';
  const href = sanitizeLinkUrl(normalizeWebsite(url));
  const safeLabel = esc(label);
  const safeBg = esc(bg);
  const safeFg = esc(fg);
  const safeFont = esc(font);
  // Rough width estimate so the VML box fits the (variable-length) label.
  const width = Math.max(120, Math.round(label.trim().length * 8.5) + 32);
  return `<div>
  <!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:34px;v-text-anchor:middle;width:${width}px;" arcsize="12%" strokecolor="${safeBg}" fillcolor="${safeBg}">
    <w:anchorlock/>
    <center style="color:${safeFg};font-family:${safeFont},sans-serif;font-size:12px;font-weight:bold;">${safeLabel}</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-->
  <a href="${href}" target="_blank" rel="noopener" style="display: inline-block; background-color: ${safeBg}; color: ${safeFg}; font-family: ${safeFont}, sans-serif; font-size: 12px; font-weight: bold; text-decoration: none; padding: 8px 16px; border-radius: 4px;">${safeLabel}</a>
  <!--<![endif]-->
</div>`;
}

/** Render a small legal/confidentiality disclaimer block, or '' when empty. */
export function renderDisclaimer(text: string, font: string, color = '#999999'): string {
  if (!text.trim()) return '';
  return `<div style="margin-top: 10px; max-width: 480px; font-size: 10px; line-height: 1.5; color: ${esc(color)}; font-family: ${esc(font)}, sans-serif;">${esc(text)}</div>`;
}

interface SocialLinkOptions {
  /** Hosted icon color style. */
  style: IconStyle;
  /** Icon width/height in px. */
  size?: number;
  /** CSS applied to each `<td>` wrapping an icon. */
  cellStyle?: string;
  /** Base URL for the hosted PNGs; defaults to the production URL. */
  baseUrl?: string;
  /** Preferred platform order; any remaining socials are appended. */
  order?: string[];
}

/**
 * Render the `<td>` cells for the populated social links of a signature, using
 * hosted PNG icons (the only format Gmail/Outlook render reliably). Shared by
 * every template so the security-sensitive markup lives in one place. Returns
 * an empty string when there are no links.
 */
export function renderSocialLinks(
  socials: Record<string, string>,
  { style, size = 18, cellStyle = 'padding-right: 6px;', baseUrl = PRODUCTION_ICON_BASE, order }: SocialLinkOptions,
): string {
  const base = baseUrl.replace(/\/$/, '');
  const ordered = order?.length
    ? [...order.filter((id) => id in socials), ...Object.keys(socials).filter((id) => !order.includes(id))]
    : Object.keys(socials);
  return ordered
    .filter((platform) => (socials[platform] ?? '').trim() && socialPlatforms.some((p) => p.id === platform))
    .map((platform) => {
      const url = sanitizeLinkUrl(buildSocialUrl(platform, socials[platform]));
      const iconUrl = `${base}/${style}/${platform}.png`;
      return `<td style="${cellStyle}"><a href="${url}" target="_blank" rel="noopener" style="text-decoration: none;"><img src="${iconUrl}" width="${size}" height="${size}" alt="${esc(platform)}" style="display: block; width: ${size}px; height: ${size}px;" /></a></td>`;
    })
    .join('');
}
