import { socialPlatforms } from '../data/socialPlatforms';
import { isIconStyle } from '../data/options';
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
 * Control characters (C0 and DEL). Browsers strip tab, newline and leading
 * or trailing controls from a URL *before* reading its scheme, so
 * `java\nscript:` is a live `javascript:` link to a browser even though a
 * naive regex never sees the word. We strip the same set up front.
 */
// eslint-disable-next-line no-control-regex -- matching control characters is the point of this regex
const URL_CONTROL_CHARS =/[\u0000-\u001F\u007F]/g;
/** A scheme as the URL spec defines it (a leading `alpha`, then `alnum + . -`). */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const ALLOWED_LINK_SCHEMES = /^(https?:|mailto:|tel:)/i;
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Sanitize a URL destined for an `href`. Only http(s), mailto and tel
 * schemes are allowed through; anything with another scheme (e.g.
 * `javascript:`) is neutralized to `#`. The result is HTML-escaped so it is
 * safe inside a double-quoted attribute.
 *
 * Two independent checks: a regex on the cleaned string, then the platform
 * URL parser's own reading of the scheme (relative URLs resolve against a
 * throwaway https base, so they pass). Both must agree the link is safe.
 */
export function sanitizeLinkUrl(url: string): string {
  const cleaned = String(url).replace(URL_CONTROL_CHARS, '').trim();
  if (!cleaned) return '';
  if (HAS_SCHEME.test(cleaned) && !ALLOWED_LINK_SCHEMES.test(cleaned)) return '#';
  try {
    const { protocol } = new URL(cleaned, 'https://relative.invalid/');
    if (!ALLOWED_PROTOCOLS.has(protocol)) return '#';
  } catch {
    return '#';
  }
  return escapeHtml(cleaned);
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

/**
 * "Looks like it already has a scheme" for user-typed website fields. Unlike
 * the spec's definition this disallows dots in the scheme, so
 * `example.com:8080/x` is read as a host with a port (and gets https://
 * prepended) rather than as the scheme `example.com`.
 */
const LOOSE_SCHEME = /^[a-z][a-z0-9+-]*:/i;

/**
 * Ensure a website URL has a protocol so links work when pasted into email.
 * Anything that already carries a scheme is left alone for `sanitizeLinkUrl`
 * to judge; this function only fills in a missing `https://`.
 */
export function normalizeWebsite(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (LOOSE_SCHEME.test(trimmed) || trimmed.startsWith('//')) return trimmed;
  return `https://${trimmed}`;
}

/** Strip the protocol for display purposes. */
export function displayWebsite(url: string): string {
  return url.replace(/^https?:\/\//i, '');
}

/** Reduce a phone number to digits/`+` for a `tel:` href. */
export function telDigits(phone: string): string {
  return phone.replace(/[^+\d]/g, '');
}

/** `linkedin.com/in/jane`, `www.x.com/jane`: a host followed by a path, typed without a scheme. */
const HOST_WITH_PATH = /^(?:[a-z0-9-]+\.)+[a-z]{2,}\//i;

/**
 * Build the full URL for a social handle, or pass a pasted profile URL
 * through. Handles are prefixed with the platform URL (a leading `@` is
 * dropped); anything that already looks like a URL is normalized instead of
 * prefixed. Platforms without a prefix (Website) are always normalized so the
 * result carries a scheme.
 */
export function buildSocialUrl(platformId: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const platform = socialPlatforms.find((p) => p.id === platformId);
  if (!platform || !platform.urlPrefix) return normalizeWebsite(trimmed);
  if (LOOSE_SCHEME.test(trimmed) || trimmed.startsWith('//') || HOST_WITH_PATH.test(trimmed)) {
    return normalizeWebsite(trimmed);
  }
  return platform.urlPrefix + trimmed.replace(/^@/, '');
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
  // Callers pass validated data, but this helper must never throw or emit
  // unescaped markup on junk either: it is the one place icon URLs are built.
  if (!socials || typeof socials !== 'object') return '';
  const safeStyle: IconStyle = isIconStyle(style) ? style : 'brand';
  const safeOrder = Array.isArray(order) ? order : [];
  const base = baseUrl.replace(/\/$/, '');
  const ordered = safeOrder.length
    ? [...safeOrder.filter((id) => Object.hasOwn(socials, id)), ...Object.keys(socials).filter((id) => !safeOrder.includes(id))]
    : Object.keys(socials);
  return ordered
    .filter((platform) => typeof socials[platform] === 'string' && socials[platform].trim() && socialPlatforms.some((p) => p.id === platform))
    .map((platform) => {
      const url = sanitizeLinkUrl(buildSocialUrl(platform, socials[platform]));
      const iconUrl = esc(`${base}/${safeStyle}/${platform}.png`);
      return `<td style="${cellStyle}"><a href="${url}" target="_blank" rel="noopener" style="text-decoration: none;"><img src="${iconUrl}" width="${size}" height="${size}" alt="${esc(platform)}" style="display: block; width: ${size}px; height: ${size}px;" /></a></td>`;
    })
    .join('');
}
