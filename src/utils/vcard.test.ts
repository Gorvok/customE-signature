import { describe, expect, it } from 'vitest';
import { buildVCard, nameParts, vcardFilename } from './vcard';
import { qrMatrix } from './qrCode';
import { defaultData } from '../data/defaults';
import { sampleData } from '../data/sampleData';

const lines = (data = sampleData) => buildVCard(data).split('\r\n');
const line = (prefix: string, data = sampleData) => lines(data).find((l) => l.startsWith(prefix));

describe('nameParts', () => {
  it('treats the last word as the family name', () => {
    expect(nameParts('Alex Rivera')).toEqual({ family: 'Rivera', given: 'Alex' });
    expect(nameParts('Maria del Carmen Soto')).toEqual({ family: 'Soto', given: 'Maria del Carmen' });
  });

  it('puts a single word in the given slot', () => {
    expect(nameParts('Prince')).toEqual({ family: '', given: 'Prince' });
  });

  it('copes with no name at all', () => {
    expect(nameParts('   ')).toEqual({ family: '', given: '' });
  });
});

describe('buildVCard', () => {
  it('is a well-formed 3.0 card with CRLF endings', () => {
    const card = buildVCard(sampleData);
    expect(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true);
    expect(card.endsWith('END:VCARD\r\n')).toBe(true);
    expect(card).not.toContain('\n\n');
    // Every line break is CRLF, never a bare LF.
    expect(card.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('always includes N, even with nothing filled in', () => {
    expect(line('N:', defaultData)).toBe('N:;;;;');
  });

  it('carries the fields a contact needs', () => {
    expect(line('FN:')).toBe(`FN:${sampleData.fullName}`);
    expect(line('ORG:')).toBe(`ORG:${sampleData.company}`);
    expect(line('TITLE:')).toContain(sampleData.jobTitle);
    expect(line('EMAIL')).toContain(sampleData.email);
    expect(line('TEL')).toBeDefined();
    expect(line('URL:')).toContain('http');
  });

  it('omits what is empty rather than emitting blank lines', () => {
    const card = buildVCard(defaultData);
    for (const prefix of ['FN:', 'ORG:', 'TITLE:', 'TEL', 'EMAIL', 'URL:', 'ADR']) {
      expect(card.includes(`\r\n${prefix}`), prefix).toBe(false);
    }
  });

  // A literal backslash is built from its char code: writing one in a nested
  // string is too easy to lose to a quoting layer, and the bug this pins was
  // exactly that.
  const BS = String.fromCharCode(92);

  it('escapes the characters that would otherwise break a line', () => {
    const card = buildVCard({
      ...defaultData,
      fullName: 'Smith; Jo',
      company: 'Acme, Inc.',
      address: 'Line one\nLine two',
      jobTitle: 'Back' + BS + 'slash',
    });
    // A raw ; or , inside a value would be read as a field separator.
    expect(card).toContain('FN:Smith' + BS + '; Jo');
    expect(card).toContain('ORG:Acme' + BS + ', Inc.');
    expect(card).toContain('Line one' + BS + 'nLine two');
    expect(card).toContain('TITLE:Back' + BS + BS + 'slash');
  });

  it('escapes the backslash before the escapes that use it', () => {
    // Input a backslash then a semicolon. The backslash must be doubled first,
    // or the escape added for ';' would itself be escaped and read back wrong.
    const card = buildVCard({ ...defaultData, company: 'a' + BS + ';b' });
    expect(card).toContain('ORG:a' + BS + BS + BS + ';b');
  });

  it('leaves campaign parameters out, since a vCard is not an email click', () => {
    const card = buildVCard({
      ...sampleData,
      website: 'https://example.com/',
      utmEnabled: true,
      utmSource: 'email',
      utmMedium: 'signature',
      utmCampaign: 'spring',
    });
    expect(card).toContain('URL:https://example.com/');
    expect(card).not.toContain('utm_');
  });

  it('includes social profiles it can build a URL for', () => {
    const card = buildVCard({
      ...defaultData,
      socials: { linkedin: 'alexrivera' },
      socialOrder: ['linkedin'],
    });
    expect(card).toContain('X-SOCIALPROFILE;TYPE=LinkedIn:');
    expect(card).toContain('linkedin.com');
  });
});

describe('vcardFilename', () => {
  it('derives a safe name', () => {
    expect(vcardFilename({ ...defaultData, fullName: 'Alex Rivera' })).toBe('alex-rivera.vcf');
    expect(vcardFilename({ ...defaultData, fullName: "D'Angelo  O'Néill!" })).toBe('d-angelo-o-n-ill.vcf');
  });

  it('falls back when there is no name', () => {
    expect(vcardFilename(defaultData)).toBe('contact.vcf');
  });
});

describe('qrMatrix', () => {
  it('produces a square matrix of modules', () => {
    const matrix = qrMatrix('https://example.com');
    expect(matrix.length).toBeGreaterThan(20);
    for (const row of matrix) expect(row).toHaveLength(matrix.length);
  });

  it('encodes a whole vCard, which is what the download holds', () => {
    const matrix = qrMatrix(buildVCard(sampleData));
    expect(matrix.length).toBeGreaterThan(40);
  });

  it('grows with the amount of data', () => {
    expect(qrMatrix(buildVCard(sampleData)).length).toBeGreaterThan(qrMatrix('hi').length);
  });

  it('has dark modules to scan', () => {
    const matrix = qrMatrix('https://example.com');
    expect(matrix.flat().filter(Boolean).length).toBeGreaterThan(50);
  });
});
