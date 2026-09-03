// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyHtmlToClipboard, htmlToPlainText } from './exportHelpers';
import { templates } from '../templates';
import { sampleData } from '../data/sampleData';

describe('htmlToPlainText', () => {
  for (const template of templates) {
    it(`turns the ${template.id} signature into readable text`, () => {
      const text = htmlToPlainText(template.render({ ...sampleData, logoUrl: 'https://example.com/logo.png' }));
      expect(text).toContain('Alex Rivera');
      expect(text).toContain('Head of Product');
      expect(text).toContain('alex@northwind.io');
      expect(text).toContain('https://northwind.io');
      expect(text).toContain('Book a meeting (https://cal.com/alex)');
      expect(text).toContain('Book a demo (https://northwind.io/demo)');
      expect(text).toContain('LinkedIn (https://www.linkedin.com/in/alexrivera)');
      expect(text).toContain('This email and any attachments are confidential');
      expect(text).not.toMatch(/[<>]/);
      expect(text).not.toMatch(/mso|roundrect|&nbsp;|&amp;/);
      expect(text).not.toContain('logo.png');
    });
  }

  it('decodes entities and collapses whitespace', () => {
    expect(htmlToPlainText('<p>Tom &amp; Jerry &middot; &#169; 2026   &nbsp; ok</p>')).toBe('Tom & Jerry · © 2026 ok');
  });

  it('keeps mailto and tel links as their labels', () => {
    expect(htmlToPlainText('<a href="mailto:a@b.com">a@b.com</a> <a href="tel:+1555">+1 555</a>')).toBe('a@b.com +1 555');
  });

  it('turns rows into lines', () => {
    expect(htmlToPlainText('<table><tr><td>one</td></tr><tr><td>two</td></tr></table>')).toBe('one\ntwo');
  });
});

describe('copyHtmlToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  function stubClipboard(write: () => Promise<void>, writeText: () => Promise<void>) {
    vi.stubGlobal('ClipboardItem', class {});
    Object.defineProperty(navigator, 'clipboard', { value: { write, writeText }, configurable: true });
  }

  it('reports rich when the HTML write succeeds', async () => {
    const write = vi.fn(() => Promise.resolve());
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(write, writeText);
    await expect(copyHtmlToClipboard('<b>x</b>')).resolves.toBe('rich');
    expect(write).toHaveBeenCalledTimes(1);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('reports text when only the plain-text write works', async () => {
    stubClipboard(vi.fn(() => Promise.reject(new Error('denied'))), vi.fn(() => Promise.resolve()));
    await expect(copyHtmlToClipboard('<b>x</b>')).resolves.toBe('text');
  });

  it('reports failed when nothing works', async () => {
    stubClipboard(vi.fn(() => Promise.reject(new Error('denied'))), vi.fn(() => Promise.reject(new Error('denied'))));
    await expect(copyHtmlToClipboard('<b>x</b>')).resolves.toBe('failed');
  });
});
