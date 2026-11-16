import { describe, expect, it } from 'vitest';
import {
  GMAIL_CLIP_BYTES,
  GMAIL_SIGNATURE_CHARS,
  compatibilityWarnings,
  formatBytes,
  isEmbeddedImage,
  signatureBytes,
} from './compatibility';
import { providers } from '../data/providers';
import { sampleData } from '../data/sampleData';

const gmail = providers.find((p) => p.id === 'gmail')!;
const outlook = providers.find((p) => p.id === 'outlook')!;
const appleMail = providers.find((p) => p.id === 'apple-mail')!;
const thunderbird = providers.find((p) => p.id === 'thunderbird')!;

const embedded = { ...sampleData, logoUrl: 'data:image/png;base64,iVBORw0KGgo=' };
const hosted = { ...sampleData, logoUrl: 'https://example.com/logo.png' };
const ids = (ws: { id: string }[]) => ws.map((w) => w.id);

describe('isEmbeddedImage', () => {
  it('recognises data URIs regardless of case or padding', () => {
    expect(isEmbeddedImage('data:image/png;base64,AAAA')).toBe(true);
    expect(isEmbeddedImage('  DATA:image/png;base64,AAAA')).toBe(true);
  });

  it('does not flag hosted or empty logos', () => {
    expect(isEmbeddedImage('https://example.com/logo.png')).toBe(false);
    expect(isEmbeddedImage('')).toBe(false);
  });
});

describe('signatureBytes', () => {
  it('counts bytes, not characters, so non-ASCII is not undercounted', () => {
    expect(signatureBytes('abc')).toBe(3);
    // '·' is two bytes in UTF-8, and templates use it as a separator.
    expect(signatureBytes('·')).toBe(2);
    expect('·'.length).toBe(1);
  });
});

describe('formatBytes', () => {
  it('uses bytes below 1 KB and kilobytes above', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
  });
});

describe('compatibilityWarnings', () => {
  it('warns by name when the chosen client strips embedded images', () => {
    const warnings = compatibilityWarnings({ html: '<p>x</p>', data: embedded, provider: gmail });
    expect(ids(warnings)).toContain('embedded-logo');
    const warning = warnings.find((w) => w.id === 'embedded-logo')!;
    expect(warning.level).toBe('warning');
    expect(warning.message).toContain('Gmail');
  });

  it('stays quiet for clients that do display embedded images', () => {
    for (const provider of [appleMail, thunderbird]) {
      const warnings = compatibilityWarnings({ html: '<p>x</p>', data: embedded, provider });
      expect(ids(warnings)).not.toContain('embedded-logo');
    }
  });

  it('cautions about the strictest client when none is chosen', () => {
    const warnings = compatibilityWarnings({ html: '<p>x</p>', data: embedded });
    const warning = warnings.find((w) => w.id === 'embedded-logo')!;
    expect(warning.level).toBe('caution');
  });

  it('says nothing about a hosted logo', () => {
    expect(ids(compatibilityWarnings({ html: '<p>x</p>', data: hosted, provider: gmail }))).toEqual([]);
  });

  it('flags a signature past Gmail’s character allowance', () => {
    const html = 'x'.repeat(GMAIL_SIGNATURE_CHARS + 1);
    expect(ids(compatibilityWarnings({ html, data: hosted, provider: gmail }))).toContain(
      'gmail-signature-length',
    );
  });

  it('does not flag length for a client that loads the signature from a file', () => {
    const html = 'x'.repeat(GMAIL_SIGNATURE_CHARS + 1);
    expect(ids(compatibilityWarnings({ html, data: hosted, provider: thunderbird }))).toEqual([]);
  });

  it('flags a signature big enough for Gmail to clip the message', () => {
    const html = 'x'.repeat(GMAIL_CLIP_BYTES + 1);
    expect(ids(compatibilityWarnings({ html, data: hosted, provider: gmail }))).toContain('gmail-clipping');
  });

  it('leaves a signature at the limits alone', () => {
    const html = 'x'.repeat(GMAIL_SIGNATURE_CHARS);
    expect(ids(compatibilityWarnings({ html, data: hosted, provider: gmail }))).toEqual([]);
  });

  it('warns when the chosen colors leave text unreadable', () => {
    const html = '<td bgcolor="#ffffff" style="color: #eeeeee; font-size: 12px;">Faint</td>';
    const warning = compatibilityWarnings({ html, data: hosted, provider: gmail }).find((w) =>
      w.id.startsWith('low-contrast'),
    );
    expect(warning?.level).toBe('warning');
    expect(warning?.message).toContain('#eeeeee');
  });

  it('does not repeat the template-level dark-mode rule in the UI', () => {
    // Text with no painted background is a template bug a test catches; no
    // choice in the UI causes it, so showing it here would only confuse.
    const html = '<div style="color: #6b7280; font-size: 10px;">Small print</div>';
    expect(ids(compatibilityWarnings({ html, data: hosted, provider: gmail }))).toEqual([]);
  });

  it('cautions about a dark surface only for a client that recolors in dark mode', () => {
    const html = '<table bgcolor="#0f172a"><tr><td style="color: #ffffff;">Name</td></tr></table>';
    expect(ids(compatibilityWarnings({ html, data: hosted, provider: outlook }))).toContain('dark-surface-recolored');
    expect(ids(compatibilityWarnings({ html, data: hosted, provider: gmail }))).not.toContain('dark-surface-recolored');
    // With no client chosen there is nothing specific to say.
    expect(ids(compatibilityWarnings({ html, data: hosted }))).not.toContain('dark-surface-recolored');
  });

  it('says nothing about a light surface, whatever the client', () => {
    const html = '<table bgcolor="#ffffff"><tr><td style="color: #111111;">Name</td></tr></table>';
    // The sample picks light icons to suit the dark default template, which is
    // its own warning; this test is about the surface.
    const data = { ...hosted, iconStyle: 'brand' as const };
    expect(ids(compatibilityWarnings({ html, data, provider: outlook }))).toEqual([]);
  });

  it('warns when white icons would sit on a white signature', () => {
    const light = { ...hosted, iconStyle: 'light' as const, socials: { github: 'octocat' } };
    const html = '<table bgcolor="#ffffff"><tr><td style="color: #111111;">Name</td></tr></table>';
    expect(ids(compatibilityWarnings({ html, data: light }))).toContain('light-icons-on-light');
  });

  it('says nothing when there is a dark area for them to sit on', () => {
    const light = { ...hosted, iconStyle: 'light' as const, socials: { github: 'octocat' } };
    const html = '<table bgcolor="#0f172a"><tr><td style="color: #ffffff;">Name</td></tr></table>';
    expect(ids(compatibilityWarnings({ html, data: light }))).not.toContain('light-icons-on-light');
  });

  it('says nothing when there are no social links to show', () => {
    const light = { ...hosted, iconStyle: 'light' as const, socials: {} };
    const html = '<table bgcolor="#ffffff"><tr><td style="color: #111111;">Name</td></tr></table>';
    expect(ids(compatibilityWarnings({ html, data: light }))).not.toContain('light-icons-on-light');
  });

  it('leaves the other icon styles alone', () => {
    const html = '<table bgcolor="#ffffff"><tr><td style="color: #111111;">Name</td></tr></table>';
    for (const iconStyle of ['brand', 'dark', 'gray'] as const) {
      const data = { ...hosted, iconStyle, socials: { github: 'octocat' } };
      expect(ids(compatibilityWarnings({ html, data })), iconStyle).not.toContain('light-icons-on-light');
    }
  });

  it('reports both the logo and the size when a big embedded logo is used', () => {
    const html = 'x'.repeat(GMAIL_CLIP_BYTES + 1);
    expect(ids(compatibilityWarnings({ html, data: embedded, provider: gmail }))).toEqual([
      'embedded-logo',
      'gmail-signature-length',
      'gmail-clipping',
    ]);
  });
});
