/**
 * The signature as a `.eml` file: a message your own mail client will open.
 *
 * The README has always ended with "send yourself a test email", which the app
 * cannot do — there is no server, and there never will be. But a `.eml` is
 * just a message on disk, and double-clicking one opens it in Apple Mail,
 * Outlook or Thunderbird as a *received* message, rendered by that client's
 * own engine rather than by a browser pretending to be one. It is the closest
 * thing to a test send that a page can hand you, and the only way to see the
 * signature the way a recipient will.
 *
 * Format: RFC 5322 headers, a MIME multipart/alternative body (RFC 2046) with
 * the plain-text and HTML parts a real client sends, base64 bodies so that
 * neither the 998-character line limit nor UTF-8 can corrupt anything, and
 * RFC 2047 encoding for headers that are not ASCII.
 */

import type { SignatureData } from '../types';
import { htmlToPlainText, signatureDocument } from './exportHelpers';

/** Base64 of a UTF-8 string, wrapped at the 76 columns MIME asks for. */
function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return (btoa(binary).match(/.{1,76}/g) ?? []).join('\r\n');
}

const IS_ASCII = /^[\x20-\x7E]*$/;

/**
 * A header value, RFC 2047 encoded when it is not plain ASCII — otherwise a
 * name in any other script arrives as mojibake in the subject line.
 */
export function encodeHeader(value: string): string {
  const clean = value.replace(/[\r\n]+/g, ' ').trim();
  return IS_ASCII.test(clean) ? clean : `=?UTF-8?B?${base64Utf8(clean).replace(/\r\n/g, '')}?=`;
}

/** RFC 5322 date, e.g. `Mon, 16 Nov 2026 17:04:05 +0000`. */
export function rfc5322Date(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${days[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} +0000`
  );
}

/**
 * An address for the From and To lines. The person's own address when they
 * have given one — the message is to themselves — and a placeholder
 * otherwise. No address that is not theirs is ever invented.
 */
function selfAddress(data: SignatureData): string {
  const email = data.email.trim();
  const name = data.fullName.trim();
  if (!email) return 'you@example.com';
  if (!name) return email;
  // A display name is either a quoted string or an encoded word, never both:
  // quoting an encoded word leaves the quotes inside the decoded name.
  const display = IS_ASCII.test(name) ? `"${name.replace(/"/g, '')}"` : encodeHeader(name);
  return `${display} <${email}>`;
}

export interface EmlOptions {
  /** Overridable so a test can pin the bytes. */
  date?: Date;
  /** Overridable so a test can pin the boundary. */
  boundary?: string;
}

/**
 * Build the message. The signature is the whole body: what you see on opening
 * the file is what a recipient sees under a message from you.
 */
export function buildEml(data: SignatureData, html: string, { date = new Date(), boundary }: EmlOptions = {}): string {
  const name = data.fullName.trim();
  const address = selfAddress(data);
  const mark = boundary ?? `signature-${Math.random().toString(36).slice(2, 10)}`;
  const intro = 'This is how your signature arrives in a mail client. Nothing was sent: this file was made in your browser.';

  const lines = [
    'MIME-Version: 1.0',
    `Date: ${rfc5322Date(date)}`,
    `From: ${address}`,
    `To: ${address}`,
    `Subject: ${encodeHeader(name ? `Signature preview — ${name}` : 'Signature preview')}`,
    `Content-Type: multipart/alternative; boundary="${mark}"`,
    '',
    `--${mark}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Utf8(`${intro}\r\n\r\n${htmlToPlainText(html)}\r\n`),
    '',
    `--${mark}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Utf8(signatureDocument(html)),
    '',
    `--${mark}--`,
    '',
  ];
  return lines.join('\r\n');
}

/** A filename for the message, named after whoever the signature is for. */
export function emlFilename(data: SignatureData): string {
  const slug = data.fullName
    .trim()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'signature'}-preview.eml`;
}
