// SVG sources live in src/data/socialIconSvgs.json so the app UI and the
// hosted-PNG generator (scripts/generate-icons.mjs) stay in sync.
// The inline SVGs below are used for the app's own UI (e.g. the form labels).
// Generated email signatures use hosted PNGs instead — see templateHelpers.ts —
// because Gmail and Outlook strip inline/data-URI SVGs.
import iconSvgs from '../data/socialIconSvgs.json';

const icons = iconSvgs as Record<string, string>;

/**
 * The color is substituted into an SVG `stroke` attribute and the result is
 * injected with dangerouslySetInnerHTML, so only simple color tokens are
 * allowed: a hex color or a bare keyword such as `currentColor`. Anything
 * carrying a quote, bracket or space could close the attribute and add markup.
 */
const SAFE_COLOR = /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|[a-z]+)$/i;

export function getSocialIconSvg(platformId: string, color: string): string {
  const svg = icons[platformId];
  if (!svg) return '';
  const safeColor = SAFE_COLOR.test(color) ? color : 'currentColor';
  return svg.replace(/__COLOR__/g, safeColor);
}
