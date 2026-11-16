import { describe, expect, it } from 'vitest';
import { buildEml, emlFilename, encodeHeader, rfc5322Date } from './eml';
import { sampleData } from '../data/sampleData';
import { defaultData } from '../data/defaults';
import { templates } from '../templates';

const fixed = new Date('2026-11-16T17:04:05Z');
const html = templates[0].render(sampleData);
const message = buildEml(sampleData, html, { date: fixed, boundary: 'test-boundary' });

/** Headers as a client reads them: everything before the blank line. */
function headers(eml: string): Record<string, string> {
  const block = eml.split('\r\n\r\n')[0] ?? '';
  const out: Record<string, string> = {};
  for (const line of block.split('\r\n')) {
    const index = line.indexOf(':');
    if (index > 0) out[line.slice(0, index).toLowerCase()] = line.slice(index + 1).trim();
  }
  return out;
}

/** The decoded body of one MIME part, found by its content type. */
function part(eml: string, type: string): string {
  const section = eml.split('--test-boundary').find((chunk) => chunk.includes(`Content-Type: ${type}`));
  if (!section) throw new Error(`no ${type} part`);
  const body = section.split('\r\n\r\n').slice(1).join('\r\n\r\n').trim();
  return new TextDecoder().decode(Uint8Array.from(atob(body.replace(/\r\n/g, '')), (c) => c.charCodeAt(0)));
}

describe('rfc5322Date', () => {
  it('writes the form a mail client parses', () => {
    expect(rfc5322Date(fixed)).toBe('Mon, 16 Nov 2026 17:04:05 +0000');
  });

  it('pads single digits, which a bare toString does not', () => {
    expect(rfc5322Date(new Date('2026-01-02T03:04:05Z'))).toBe('Fri, 02 Jan 2026 03:04:05 +0000');
  });
});

describe('encodeHeader', () => {
  it('leaves ASCII alone, so the file stays readable', () => {
    expect(encodeHeader('Signature preview — Alex')).toContain('=?UTF-8?B?');
    expect(encodeHeader('Signature preview')).toBe('Signature preview');
  });

  it('encodes anything that is not ASCII, rather than shipping mojibake', () => {
    const encoded = encodeHeader('ليلى منصور');
    expect(encoded.startsWith('=?UTF-8?B?')).toBe(true);
    expect(encoded.endsWith('?=')).toBe(true);
    const base64 = encoded.slice('=?UTF-8?B?'.length, -2);
    expect(new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)))).toBe('ليلى منصور');
  });

  it('never lets a newline split the header', () => {
    expect(encodeHeader('one\r\ntwo')).toBe('one two');
  });
});

describe('buildEml', () => {
  it('carries the headers a client needs to show it as a message', () => {
    const head = headers(message);
    expect(head['mime-version']).toBe('1.0');
    expect(head.date).toBe('Mon, 16 Nov 2026 17:04:05 +0000');
    expect(head['content-type']).toBe('multipart/alternative; boundary="test-boundary"');
    expect(head.subject).toContain('=?UTF-8?B?');
  });

  it('is from and to the person themselves, and invents no other address', () => {
    const head = headers(message);
    expect(head.from).toContain('<alex@northwind.io>');
    expect(head.from).toContain('Alex Rivera');
    expect(head.to).toBe(head.from);
  });

  it('writes a name in another script as an encoded word, not a quoted one', () => {
    // Quoting an encoded word leaves the quotes in the name a client shows.
    const arabic = { ...sampleData, fullName: 'ليلى منصور' };
    const from = headers(buildEml(arabic, '<p>x</p>', { date: fixed, boundary: 'b' })).from ?? '';
    expect(from).toMatch(/^=\?UTF-8\?B\?[^?]+\?= <alex@northwind\.io>$/);
    expect(from).not.toContain('"');
  });

  it('uses a placeholder when no address was given', () => {
    const head = headers(buildEml(defaultData, '<p>x</p>', { date: fixed, boundary: 'b' }));
    expect(head.from).toBe('you@example.com');
  });

  it('sends both parts a real client sends', () => {
    expect(part(message, 'text/html; charset="UTF-8"')).toContain('Alex Rivera');
    expect(part(message, 'text/plain; charset="UTF-8"')).toContain('Alex Rivera');
  });

  it('wraps the HTML part as a document, with the colour-scheme metas', () => {
    const body = part(message, 'text/html; charset="UTF-8"');
    expect(body.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(body).toContain('<meta name="color-scheme" content="light dark">');
  });

  it('gives the plain-text part a readable rendering, not markup', () => {
    const text = part(message, 'text/plain; charset="UTF-8"');
    expect(text).toContain('alex@northwind.io');
    expect(text).not.toMatch(/[<>]/);
  });

  it('says plainly that nothing was sent', () => {
    expect(part(message, 'text/plain; charset="UTF-8"')).toContain('Nothing was sent');
  });

  it('closes the multipart body as the format requires', () => {
    expect(message.trimEnd().endsWith('--test-boundary--')).toBe(true);
    // Opening boundary for each part, plus the closing one.
    expect(message.match(/--test-boundary/g)).toHaveLength(3);
  });

  it('uses CRLF throughout, as a message must', () => {
    expect(message.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('keeps base64 lines inside the 76 columns MIME allows', () => {
    for (const line of message.split('\r\n')) {
      expect(line.length, line.slice(0, 40)).toBeLessThanOrEqual(998);
    }
    const body = message.split('\r\n\r\n').slice(2).join('\r\n');
    for (const line of body.split('\r\n')) {
      if (/^[A-Za-z0-9+/=]+$/.test(line)) expect(line.length).toBeLessThanOrEqual(76);
    }
  });

  it('survives a signature in another script', () => {
    const arabic = { ...sampleData, fullName: 'ليلى منصور', email: 'laila@northwind.io' };
    const eml = buildEml(arabic, templates[0].render(arabic), { date: fixed, boundary: 'b' });
    const section = eml.split('--b').find((chunk) => chunk.includes('text/html'))!;
    const body = section.split('\r\n\r\n').slice(1).join('\r\n\r\n').trim();
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(body.replace(/\r\n/g, '')), (c) => c.charCodeAt(0)),
    );
    expect(decoded).toContain('ليلى منصور');
  });

  it('gives every template a message that parses', () => {
    for (const template of templates) {
      const eml = buildEml(sampleData, template.render(sampleData), { date: fixed, boundary: 'b' });
      expect(headers(eml)['content-type'], template.id).toContain('multipart/alternative');
      expect(eml.trimEnd().endsWith('--b--'), template.id).toBe(true);
    }
  });
});

describe('emlFilename', () => {
  it('names the file after the person', () => {
    expect(emlFilename(sampleData)).toBe('alex-rivera-preview.eml');
    expect(emlFilename({ ...sampleData, fullName: 'José Álvarez' })).toBe('jose-alvarez-preview.eml');
  });

  it('falls back when the name has no ASCII form', () => {
    expect(emlFilename({ ...sampleData, fullName: 'ليلى منصور' })).toBe('signature-preview.eml');
    expect(emlFilename(defaultData)).toBe('signature-preview.eml');
  });
});
