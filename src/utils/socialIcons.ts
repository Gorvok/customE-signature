// SVG sources live in src/data/socialIconSvgs.json so the app UI and the
// hosted-PNG generator (scripts/generate-icons.mjs) stay in sync.
// The inline SVGs below are used for the app's own UI (e.g. the form labels).
// Generated email signatures use hosted PNGs instead — see templateHelpers.ts —
// because Gmail and Outlook strip inline/data-URI SVGs.
import iconSvgs from '../data/socialIconSvgs.json';

const icons = iconSvgs as Record<string, string>;

export function getSocialIconSvg(platformId: string, color: string): string {
  const svg = icons[platformId];
  if (!svg) return '';
  return svg.replace(/__COLOR__/g, color);
}
