import { describe, expect, it } from 'vitest';
import {
  MONOGRAM_MAX_CHARS,
  initialsOf,
  monogramLetters,
  renderBrandMark,
  renderMonogram,
} from './monogram';
import { findEmailSafetyIssues, formatIssues } from './emailSafety';
import { findDarkModeIssues, formatDarkModeIssues } from './darkMode';
import { finalizeHtml } from './templateHelpers';
import { defaultData } from '../data/defaults';
import { sampleData } from '../data/sampleData';

describe('initialsOf', () => {
  it('takes the first and last word', () => {
    expect(initialsOf('Alex Rivera')).toBe('AR');
    expect(initialsOf('Maria de la Cruz')).toBe('MC');
  });

  it('gives one letter for a single word rather than two from the same one', () => {
    expect(initialsOf('Prince')).toBe('P');
  });

  it('keeps a hyphenated or apostrophised surname whole', () => {
    expect(initialsOf('Jane Doe-Smith')).toBe('JD');
    expect(initialsOf("Seán O'Brien")).toBe('SO');
  });

  it('skips a word that does not start with a letter', () => {
    expect(initialsOf('Jane (Jay) Doe')).toBe('JD');
    expect(initialsOf('Jane Doe (she/her)')).toBe('JD');
  });

  it('works in scripts that are not Latin', () => {
    expect(initialsOf('Яна Иванова')).toBe('ЯИ');
    expect(initialsOf('محمد علي')).toBe('مع');
    expect(initialsOf('田中 太郎')).toBe('田太');
  });

  it('keeps an emoji or symbol out of the initials', () => {
    expect(initialsOf('🚀 Jane Doe')).toBe('JD');
    expect(initialsOf('🚀')).toBe('');
  });

  it('is empty when there is nothing to take', () => {
    expect(initialsOf('')).toBe('');
    expect(initialsOf('   ')).toBe('');
    expect(initialsOf('--- ...')).toBe('');
  });

  it('upper-cases what it finds', () => {
    expect(initialsOf('alex rivera')).toBe('AR');
  });
});

describe('monogramLetters', () => {
  const base = { monogramText: '', fullName: '', company: '' };

  it('prefers what the person typed', () => {
    expect(monogramLetters({ ...base, monogramText: 'nw', fullName: 'Alex Rivera' })).toBe('NW');
  });

  it('falls back to the name, then the company', () => {
    expect(monogramLetters({ ...base, fullName: 'Alex Rivera', company: 'Northwind Labs' })).toBe('AR');
    expect(monogramLetters({ ...base, company: 'Northwind Labs' })).toBe('NL');
  });

  it('is empty when there is nothing to draw', () => {
    expect(monogramLetters(base)).toBe('');
  });

  it('caps an override at three characters, counting them as a reader would', () => {
    expect(monogramLetters({ ...base, monogramText: 'ABCDEF' })).toBe('ABC');
    // Surrogate pairs count as one character, not two.
    expect([...monogramLetters({ ...base, monogramText: '🚀🚀🚀🚀' })]).toHaveLength(MONOGRAM_MAX_CHARS);
  });
});

describe('renderMonogram', () => {
  const options = { size: 52, background: '#0f172a', font: 'Inter' };

  it('is empty without letters, so a template can leave the space alone', () => {
    expect(renderMonogram('', options)).toBe('');
    expect(renderMonogram('   ', options)).toBe('');
  });

  it('needs no image at all', () => {
    const html = renderMonogram('AR', options);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('data:');
    expect(html).toContain('>AR<');
  });

  it('is small enough to ignore against Gmail’s allowance', () => {
    // The limitation it exists to solve: an embedded PNG can use half of the
    // ~10,000 characters Gmail stores, where this is under a kilobyte
    // including the Outlook fallback.
    expect(renderMonogram('AR', options).length).toBeLessThan(1000);
  });

  it('gives Outlook a VML oval, since the Word engine ignores border-radius', () => {
    const html = renderMonogram('AR', options);
    expect(html).toContain('<!--[if mso]>');
    expect(html).toMatch(/<v:oval[^>]*fillcolor="#0f172a"/);
    // And every other client gets the rounded cell.
    expect(html).toContain('border-radius: 50%');
  });

  it('sizes the cell with attributes as well as CSS, which is what Outlook reads', () => {
    const html = renderMonogram('AR', options);
    expect(html).toContain('width="52" height="52"');
    expect(html).toContain('width: 52px; height: 52px;');
    expect(html).toContain('line-height: 52px');
  });

  it('picks letter colors that can be read on the circle', () => {
    expect(renderMonogram('AR', { ...options, background: '#0f172a' })).toContain('color: #ffffff');
    expect(renderMonogram('AR', { ...options, background: '#f8fafc' })).toContain('color: #000000');
  });

  it('honors an explicit letter color and border', () => {
    const html = renderMonogram('AR', { ...options, color: '#ff0000', border: '2px solid #ffffff' });
    expect(html).toContain('color: #ff0000');
    expect(html).toContain('border: 2px solid #ffffff');
  });

  it('shrinks the letters when there are three of them', () => {
    expect(renderMonogram('AR', options)).toContain('font-size: 21px');
    expect(renderMonogram('ARJ', options)).toContain('font-size: 17px');
  });

  it('escapes the letters', () => {
    const html = renderMonogram('"><script>', options);
    expect(html).not.toContain('<script');
    expect(html).toContain('&quot;&gt;&lt;script&gt;');
  });

  it('escapes the colors it is handed', () => {
    // parseConfig only admits hex colors, but a template may be called directly.
    const html = renderMonogram('AR', { ...options, background: '" onmouseover="alert(1)' });
    expect(html).not.toContain('onmouseover="alert(1)"');
    expect(html).toContain('&quot; onmouseover=&quot;alert(1)');
  });

  it('is email-safe and survives dark mode', () => {
    const html = finalizeHtml(renderMonogram('AR', options));
    const safety = findEmailSafetyIssues(html);
    expect(safety, `\n${formatIssues(safety)}`).toEqual([]);
    const dark = findDarkModeIssues(html);
    expect(dark, `\n${formatDarkModeIssues(dark)}`).toEqual([]);
  });
});

describe('renderBrandMark', () => {
  const hosted = { ...sampleData, logoUrl: 'https://example.com/logo.png' };

  it('renders the logo when that is the chosen mark', () => {
    const html = renderBrandMark({ ...hosted, brandMark: 'logo' }, { width: 80, background: '#0f172a' });
    expect(html).toContain('src="https://example.com/logo.png"');
    expect(html).toContain('width="80"');
    expect(html).not.toContain('v:oval');
  });

  it('renders the monogram instead when that is the chosen mark, logo or no logo', () => {
    const html = renderBrandMark({ ...hosted, brandMark: 'monogram' }, { width: 80, background: '#0f172a' });
    expect(html).not.toContain('logo.png');
    expect(html).toContain('>AR<');
    expect(html).toContain('width="80" height="80"');
  });

  it('passes the logo style to the image and nothing else', () => {
    const options = { width: 80, background: '#0f172a', logoStyle: 'border-radius: 4px;' };
    expect(renderBrandMark({ ...hosted, brandMark: 'logo' }, options)).toContain('border-radius: 4px;');
    const monogram = renderBrandMark({ ...hosted, brandMark: 'monogram' }, options);
    expect(monogram).toContain('border-radius: 50%');
    expect(monogram).not.toContain('border-radius: 4px;');
  });

  it('is empty when the chosen mark has nothing to show', () => {
    expect(renderBrandMark({ ...defaultData, brandMark: 'logo' }, { width: 80, background: '#000000' })).toBe('');
    expect(renderBrandMark({ ...defaultData, brandMark: 'monogram' }, { width: 80, background: '#000000' })).toBe('');
  });

  it('sizes the monogram on its own, since a disc is not a wordmark', () => {
    const options = { width: 100, monogramSize: 64, background: '#0f172a' };
    expect(renderBrandMark({ ...hosted, brandMark: 'logo' }, options)).toContain('width="100"');
    expect(renderBrandMark({ ...hosted, brandMark: 'monogram' }, options)).toContain('width="64" height="64"');
  });

  it('takes the font from the signature, so the mark matches the text', () => {
    const html = renderBrandMark({ ...hosted, brandMark: 'monogram', fontFamily: 'Georgia' }, { width: 80, background: '#0f172a' });
    expect(html).toContain('font-family: Georgia, Times New Roman, Times, serif');
  });
});
