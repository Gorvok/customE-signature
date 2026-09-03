import { describe, expect, it } from 'vitest';
import { templates } from './index';
import { sampleData } from '../data/sampleData';

/** Templates on a transparent background that must paint their own white for non-inverting dark-mode clients. */
const LIGHT_TEMPLATES = ['modern-light', 'minimal', 'corporate', 'elegant', 'compact-card'];

const data = { ...sampleData, logoUrl: 'https://example.com/logo.png' };

function render(id: string): string {
  const template = templates.find((t) => t.id === id);
  if (!template) throw new Error(`no template ${id}`);
  return template.render(data);
}

for (const template of templates) {
  describe(`template ${template.id}`, () => {
    const html = template.render(data);

    it('matches its snapshot', () => {
      expect(html).toMatchSnapshot();
    });

    it('renders the name, role, company, address and disclaimer', () => {
      for (const text of [data.fullName, data.jobTitle, data.company, data.address, data.disclaimer]) {
        expect(html).toContain(text);
      }
    });

    it('links phone, email, website and booking with sanitized hrefs', () => {
      expect(html).toContain('href="tel:+14155550123"');
      expect(html).toContain('href="mailto:alex@northwind.io"');
      expect(html).toContain('href="https://northwind.io"');
      expect(html).toContain('href="https://cal.com/alex"');
    });

    it('renders the logo with width and border attributes', () => {
      const logo = html.match(/<img[^>]*src="https:\/\/example\.com\/logo\.png"[^>]*>/)?.[0];
      expect(logo).toBeDefined();
      expect(logo).toMatch(/\swidth="\d+"/);
      expect(logo).toContain('border="0"');
    });

    it('sets a font on every cell that holds text or a text link', () => {
      // Outlook does not reliably inherit font-family from a parent table.
      for (const m of html.matchAll(/<td([^>]*)>([^<]*)/g)) {
        const text = (m[2] ?? '').replace(/&nbsp;/g, '').trim();
        if (text) expect(m[1], `cell holding "${text.slice(0, 40)}"`).toContain('font-family');
      }
      for (const m of html.matchAll(/<td([^>]*)>\s*<a[^>]*>(?!<img)/g)) {
        expect(m[1], 'cell holding a text link').toContain('font-family');
      }
    });

    it('never puts padding on a table element', () => {
      // Outlook drops padding declared on <table>; it belongs on a cell.
      expect(html).not.toMatch(/<table[^>]*style="[^"]*\bpadding/);
    });

    it('gives every image width and border attributes', () => {
      for (const m of html.matchAll(/<img[^>]*>/g)) {
        expect(m[0]).toMatch(/\swidth="\d+"/);
        expect(m[0]).toContain('border="0"');
      }
    });

    it('uses a full font stack ending in a generic family', () => {
      expect(html).toMatch(/font-family: [^;"]*(sans-serif|serif|monospace)/);
      expect(html).not.toMatch(/font-family: Inter;/);
    });
  });
}

describe('light templates', () => {
  for (const id of LIGHT_TEMPLATES) {
    it(`${id} paints its own white background`, () => {
      const outer = render(id).match(/<table[^>]*>/)?.[0] ?? '';
      expect(outer).toContain('bgcolor="#ffffff"');
      expect(outer).toContain('background-color: #ffffff');
    });
  }
});

describe('classic-dark', () => {
  it('keeps the disclaimer inside the dark box so light text stays readable', () => {
    const html = render('classic-dark');
    // The outer table closes last; the disclaimer must come before it.
    expect(html.indexOf(data.disclaimer)).toBeLessThan(html.lastIndexOf('</table>'));
    // And it inherits the light secondary color, which is only readable on the dark box.
    expect(html).toMatch(/color: #f8fafc; font-family: [^"]*">This email and any attachments/);
  });
});

describe('outlook spacer cells', () => {
  it('corporate accent bar carries a width attribute, a bgcolor and content', () => {
    expect(render('corporate')).toMatch(/<td width="4" bgcolor="#0f172a"[^>]*>&nbsp;<\/td>/);
  });

  it('elegant divider lines and dot carry explicit sizes', () => {
    const html = render('elegant');
    expect(html).toMatch(/<td width="40" height="1" bgcolor="#0f172a"/);
    expect(html).toMatch(/<td width="6" height="6" bgcolor="#0f172a"/);
    expect(html).toMatch(/<td width="8" style="[^"]*line-height: 0;[^"]*">&nbsp;<\/td>/);
  });
});

describe('minimal', () => {
  it('renders the uploaded logo', () => {
    expect(render('minimal')).toContain('src="https://example.com/logo.png"');
  });
});

describe('bold-banner', () => {
  it('no longer declares a colspan for a single-column layout', () => {
    expect(render('bold-banner')).not.toContain('colspan');
  });
});
