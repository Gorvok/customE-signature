/**
 * Check a signature somebody already uses.
 *
 * The app's own templates are held to three sets of rules: markup a mail
 * client will actually render (emailSafety), text that survives a client in
 * dark mode (darkMode), and Gmail's size limits (compatibility). All three are
 * pure functions over HTML, so they work just as well on a signature that
 * came from somewhere else — which is the common case. Most people arrive
 * with one already pasted into Gmail that "looks wrong in Outlook" and no way
 * to find out why.
 */

import { findDarkModeIssues, type DarkModeIssue } from './darkMode';
import { findEmailSafetyIssues, type EmailSafetyIssue } from './emailSafety';
import { GMAIL_CLIP_BYTES, GMAIL_SIGNATURE_CHARS, formatBytes, signatureBytes } from './compatibility';

export interface SizeFinding {
  id: 'gmail-signature-length' | 'gmail-clipping';
  message: string;
}

export interface SignatureReport {
  /** Bytes as a client stores and sends it. */
  bytes: number;
  characters: number;
  /** Markup a mail client strips, breaks on, or sizes wrongly. */
  safety: EmailSafetyIssue[];
  /** Text that disappears or cannot be read, in dark mode or at all. */
  darkMode: DarkModeIssue[];
  size: SizeFinding[];
  /** How many problems in total, across all three. */
  problems: number;
}

/** True once there is markup to look at: a bare line of text is not a signature. */
export function looksLikeHtml(input: string): boolean {
  return /<[a-z!][\s\S]*>/i.test(input);
}

/**
 * Everything the app can tell about a signature it did not generate. Never
 * throws: the input is whatever was in someone's clipboard.
 */
export function checkSignature(html: string): SignatureReport {
  const bytes = signatureBytes(html);
  const size: SizeFinding[] = [];

  if (html.length > GMAIL_SIGNATURE_CHARS) {
    size.push({
      id: 'gmail-signature-length',
      message:
        `This is ${html.length.toLocaleString()} characters. Gmail's signature box holds about ` +
        `${GMAIL_SIGNATURE_CHARS.toLocaleString()}, so the end of it may be cut off.`,
    });
  }
  if (bytes > GMAIL_CLIP_BYTES) {
    size.push({
      id: 'gmail-clipping',
      message:
        `At ${formatBytes(bytes)} this is large enough for Gmail to clip your messages, hiding everything ` +
        'past it behind "View entire message".',
    });
  }

  const safety = findEmailSafetyIssues(html);
  const darkMode = findDarkModeIssues(html);

  return {
    bytes,
    characters: html.length,
    safety,
    darkMode,
    size,
    problems: safety.length + darkMode.length + size.length,
  };
}
