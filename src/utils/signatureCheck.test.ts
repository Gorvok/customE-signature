import { describe, expect, it } from 'vitest';
import { checkSignature, looksLikeHtml } from './signatureCheck';
import { GMAIL_CLIP_BYTES, GMAIL_SIGNATURE_CHARS } from './compatibility';
import { templates } from '../templates';
import { sampleData } from '../data/sampleData';

describe('looksLikeHtml', () => {
  it('accepts markup and rejects the text a signature shows', () => {
    expect(looksLikeHtml('<table><tr><td>x</td></tr></table>')).toBe(true);
    expect(looksLikeHtml('<!doctype html><html><body>x</body></html>')).toBe(true);
    expect(looksLikeHtml('Alex Rivera\nHead of Product\nalex@northwind.io')).toBe(false);
    expect(looksLikeHtml('')).toBe(false);
    // A stray comparison is not markup.
    expect(looksLikeHtml('3 < 5 and 6 > 2')).toBe(false);
  });
});

describe('checkSignature', () => {
  it('passes a signature this app generated', () => {
    // The templates are held to these rules, so each one is its own fixture.
    for (const template of templates) {
      const report = checkSignature(template.render({ ...sampleData, logoUrl: 'https://example.com/logo.png' }));
      expect(report.problems, template.id).toBe(0);
    }
  });

  it('finds the markup a mail client strips', () => {
    const report = checkSignature('<div style="display: flex;"><style>p{color:red}</style><p class="x">Hi</p></div>');
    const rules = report.safety.map((issue) => issue.rule);
    expect(rules).toContain('style-block');
    expect(rules).toContain('class-attribute');
    expect(rules).toContain('unsupported-css');
    expect(report.problems).toBeGreaterThan(0);
  });

  it('finds an embedded image, the commonest reason a logo never arrives', () => {
    const html = '<img src="data:image/png;base64,iVBORw0KGgo=" width="80" alt="Logo">';
    expect(checkSignature(html).safety.map((i) => i.rule)).toContain('embedded-image');
  });

  it('finds text that a dark-mode client will swallow', () => {
    const report = checkSignature('<div style="color: #666666; font-size: 11px;">Confidential</div>');
    expect(report.darkMode.map((issue) => issue.rule)).toContain('text-on-client-background');
  });

  it('reports Gmail’s character limit', () => {
    const html = `<div>${'x'.repeat(GMAIL_SIGNATURE_CHARS)}</div>`;
    expect(checkSignature(html).size.map((f) => f.id)).toContain('gmail-signature-length');
  });

  it('reports the size at which Gmail clips the message', () => {
    const html = `<div>${'x'.repeat(GMAIL_CLIP_BYTES)}</div>`;
    expect(checkSignature(html).size.map((f) => f.id)).toContain('gmail-clipping');
  });

  it('counts bytes rather than characters, so non-ASCII is not undercounted', () => {
    const report = checkSignature('<p>ليلى</p>');
    expect(report.characters).toBe('<p>ليلى</p>'.length);
    expect(report.bytes).toBeGreaterThan(report.characters);
  });

  it('survives whatever was on the clipboard', () => {
    for (const input of ['', '<', '<table>', '<div style="color:">x</div>', '<!-- just a comment -->']) {
      expect(() => checkSignature(input), JSON.stringify(input)).not.toThrow();
    }
  });

  it('adds up every kind of problem it found', () => {
    const report = checkSignature('<div class="x" style="color: #666666;">Hi</div>');
    expect(report.problems).toBe(report.safety.length + report.darkMode.length + report.size.length);
    expect(report.problems).toBeGreaterThanOrEqual(2);
  });
});
