import type { SignatureData } from '../types';
import { buildSocialUrl, normalizeWebsite, telDigits } from './templateHelpers';
import { socialPlatforms } from '../data/socialPlatforms';

/**
 * A vCard 3.0 contact card built from the signature.
 *
 * Downloaded as a .vcf it can be attached to an email or imported directly,
 * which sidesteps the embedded-image problem entirely — unlike a logo or a QR
 * code, a contact card is a file, not markup a client can strip.
 */

/**
 * Escape a text value: backslash first, or the escapes added after it would
 * be escaped in turn.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/** Split a display name into the family/given slots N expects. */
export function nameParts(fullName: string): { family: string; given: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { family: '', given: '' };
  if (parts.length === 1) return { family: '', given: parts[0]! };
  return { family: parts[parts.length - 1]!, given: parts.slice(0, -1).join(' ') };
}

export function buildVCard(data: SignatureData): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];
  const add = (line: string) => lines.push(line);

  const fullName = data.fullName.trim();
  const { family, given } = nameParts(fullName);
  // N is mandatory in 3.0 even when the parts are empty.
  add(`N:${escapeText(family)};${escapeText(given)};;;`);
  if (fullName) add(`FN:${escapeText(fullName)}`);

  const company = data.company.trim();
  if (company) add(`ORG:${escapeText(company)}`);

  const title = [data.jobTitle.trim(), data.department.trim()].filter(Boolean).join(', ');
  if (title) add(`TITLE:${escapeText(title)}`);

  const phone = data.phone.trim();
  if (phone) {
    // Prefer a dialable form, falling back to whatever was typed.
    const digits = telDigits(phone);
    add(`TEL;TYPE=WORK,VOICE:${escapeText(digits || phone)}`);
  }

  const email = data.email.trim();
  if (email) add(`EMAIL;TYPE=WORK,INTERNET:${escapeText(email)}`);

  // The website goes in untagged: a vCard is not an email click, so campaign
  // parameters would be both wrong and permanent in someone's address book.
  const website = data.website.trim();
  if (website) add(`URL:${escapeText(normalizeWebsite(website))}`);

  const address = data.address.trim();
  if (address) add(`ADR;TYPE=WORK:;;${escapeText(address)};;;;`);

  for (const id of data.socialOrder) {
    const handle = data.socials[id]?.trim();
    if (!handle) continue;
    const platform = socialPlatforms.find((p) => p.id === id);
    if (!platform) continue;
    const url = buildSocialUrl(id, handle);
    if (url) add(`X-SOCIALPROFILE;TYPE=${escapeText(platform.name)}:${escapeText(url)}`);
  }

  add('END:VCARD');
  // CRLF is what the spec requires. Long lines are left unfolded on purpose:
  // folding has to count octets rather than characters, and splitting a
  // multi-byte character corrupts the card in a way no client recovers from.
  return lines.join('\r\n') + '\r\n';
}

/** A filename-safe .vcf name derived from the person's name. */
export function vcardFilename(data: SignatureData): string {
  const base = data.fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${base || 'contact'}.vcf`;
}
