import type { EmailProvider, SignatureData } from '../types';
import { isDarkColor } from './color';
import { findDarkModeIssues, paintedBackgrounds } from './darkMode';

/**
 * Gmail's signature editor stores roughly this many characters. A logo
 * embedded as a data URI is counted in full, so a single image can use the
 * whole allowance on its own.
 */
export const GMAIL_SIGNATURE_CHARS = 10_000;

/**
 * Past roughly this size Gmail clips a message, hiding the end of it — the
 * signature included — behind a "View entire message" link.
 */
export const GMAIL_CLIP_BYTES = 102_400;

/** True when the logo is embedded in the markup rather than linked from a host. */
export function isEmbeddedImage(url: string): boolean {
  return url.trim().toLowerCase().startsWith('data:');
}

/** Byte length of the signature, as a mail client stores and sends it. */
export function signatureBytes(html: string): number {
  return new TextEncoder().encode(html).length;
}

export function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export interface CompatibilityWarning {
  id: string;
  /** `warning` is a known failure in the chosen client; `caution` is a risk in some clients. */
  level: 'warning' | 'caution';
  message: string;
}

/**
 * Problems a person cannot see in the preview, because the preview is a
 * browser and their mail client is not.
 *
 * Pass the provider they picked to get advice specific to it; with none, the
 * advice covers the strictest client so the signature travels anywhere.
 */
export function compatibilityWarnings({
  html,
  data,
  provider,
}: {
  html: string;
  data: SignatureData;
  provider?: EmailProvider | undefined;
}): CompatibilityWarning[] {
  const warnings: CompatibilityWarning[] = [];

  // An embedded logo renders perfectly in the preview and then vanishes in the
  // clients that strip data URIs, which is most of them. A monogram is drawn
  // with markup, so none of this applies to it.
  if (data.brandMark === 'logo' && isEmbeddedImage(data.logoUrl)) {
    if (provider && !provider.rendersEmbeddedImages) {
      warnings.push({
        id: 'embedded-logo',
        level: 'warning',
        message:
          `${provider.name} removes embedded images, so your uploaded logo will not appear. Paste a public ` +
          'image URL instead, or switch the brand mark to a monogram, which is drawn with markup and needs no hosting.',
      });
    } else if (!provider) {
      warnings.push({
        id: 'embedded-logo',
        level: 'caution',
        message:
          'Your logo is embedded in the signature. Gmail, Outlook and Yahoo Mail remove embedded images — paste a ' +
          'public image URL instead, or switch the brand mark to a monogram, which needs no hosting.',
      });
    }
  }

  // Gmail's own limits. They do not apply to a signature loaded from a file,
  // so only raise them when Gmail is in play.
  const gmailInPlay = !provider || provider.id === 'gmail';
  if (gmailInPlay) {
    const characters = html.length;
    if (characters > GMAIL_SIGNATURE_CHARS) {
      warnings.push({
        id: 'gmail-signature-length',
        level: 'warning',
        message: `This signature is ${characters.toLocaleString()} characters. Gmail's signature box holds about ${GMAIL_SIGNATURE_CHARS.toLocaleString()}, so it may be cut off.`,
      });
    }

    const bytes = signatureBytes(html);
    if (bytes > GMAIL_CLIP_BYTES) {
      warnings.push({
        id: 'gmail-clipping',
        level: 'warning',
        message: `At ${formatBytes(bytes)} this signature is large enough for Gmail to clip your messages, hiding the end behind "View entire message".`,
      });
    }
  }

  // The colors are the person's own choice, so a pair that cannot be read is
  // theirs to fix. (The template-level rule — that text must sit on a
  // background the markup paints — is enforced by a test, since no choice in
  // the UI can cause or fix it.)
  for (const issue of findDarkModeIssues(html)) {
    if (issue.rule !== 'low-contrast') continue;
    warnings.push({
      id: `low-contrast-${issue.color}-${issue.background ?? 'none'}`,
      level: 'warning',
      message: issue.message,
    });
  }

  // White icons on a white signature. The icon style is chosen once in the
  // branding panel and the template is chosen elsewhere, so the two drift
  // apart easily — and the icons do not fail loudly, they just vanish.
  if (data.iconStyle === 'light' && Object.values(data.socials).some((value) => value.trim())) {
    const painted = paintedBackgrounds(html);
    if (painted.length && !painted.some(isDarkColor)) {
      warnings.push({
        id: 'light-icons-on-light',
        level: 'warning',
        message:
          'Your social icons are the light (white) style and this template has no dark area for them to sit on, ' +
          'so they will be invisible. Pick Brand, Dark or Gray icons instead.',
      });
    }
  }

  // A signature that paints a dark surface is at the mercy of the clients
  // that recolor content in dark mode. Only raised for a client known to do
  // it, because there is nothing to fix otherwise.
  if (provider?.recolorsInDarkMode && paintedBackgrounds(html).some(isDarkColor)) {
    warnings.push({
      id: 'dark-surface-recolored',
      level: 'caution',
      message:
        `${provider.name} rewrites colors in dark mode, and this signature paints a dark background. ` +
        'Light text on it may be recolored to something harder to read — a light template avoids that.',
    });
  }

  return warnings;
}
