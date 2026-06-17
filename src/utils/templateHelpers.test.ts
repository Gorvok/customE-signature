import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  sanitizeLinkUrl,
  sanitizeImageUrl,
  normalizeWebsite,
  displayWebsite,
  telDigits,
  buildSocialUrl,
  renderSocialLinks,
  PRODUCTION_ICON_BASE,
} from './templateHelpers';
import { templates } from '../templates';
import type { SignatureData } from '../types';

describe('escapeHtml', () => {
  it('escapes HTML-significant characters', () => {
    expect(escapeHtml(`<script>"&'`)).toBe('&lt;script&gt;&quot;&amp;&#39;');
  });

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('John Doe')).toBe('John Doe');
  });
});

describe('sanitizeLinkUrl', () => {
  it('allows http(s), mailto and tel', () => {
    expect(sanitizeLinkUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeLinkUrl('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(sanitizeLinkUrl('tel:+123')).toBe('tel:+123');
  });

  it('neutralizes javascript: and other schemes', () => {
    expect(sanitizeLinkUrl('javascript:alert(1)')).toBe('#');
    expect(sanitizeLinkUrl('data:text/html,<script>')).toBe('#');
  });

  it('escapes quotes to prevent attribute breakout', () => {
    expect(sanitizeLinkUrl('https://x.com/"onmouseover="alert(1)')).not.toContain('"');
  });
});

describe('sanitizeImageUrl', () => {
  it('allows http(s) and data:image', () => {
    expect(sanitizeImageUrl('https://x.com/a.png')).toBe('https://x.com/a.png');
    expect(sanitizeImageUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
  });

  it('rejects non-image and dangerous URLs', () => {
    expect(sanitizeImageUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeImageUrl('data:text/html,<script>')).toBe('');
  });
});

describe('url helpers', () => {
  it('normalizeWebsite adds protocol when missing', () => {
    expect(normalizeWebsite('example.com')).toBe('https://example.com');
    expect(normalizeWebsite('http://example.com')).toBe('http://example.com');
  });

  it('displayWebsite strips the protocol', () => {
    expect(displayWebsite('https://example.com')).toBe('example.com');
  });

  it('telDigits keeps only + and digits', () => {
    expect(telDigits('(555) 123-4567')).toBe('5551234567');
    expect(telDigits('+1 555 123')).toBe('+1555123');
  });

  it('buildSocialUrl prefixes handles and passes full URLs through', () => {
    expect(buildSocialUrl('github', 'octocat')).toBe('https://github.com/octocat');
    expect(buildSocialUrl('github', 'https://github.com/octocat')).toBe('https://github.com/octocat');
  });
});

describe('renderSocialLinks', () => {
  it('uses hosted PNGs for the selected style and base URL', () => {
    const html = renderSocialLinks({ github: 'octocat' }, { style: 'brand' });
    expect(html).toContain(`src="${PRODUCTION_ICON_BASE}/brand/github.png"`);
    expect(html).toContain('href="https://github.com/octocat"');
    expect(html).not.toContain('data:image/svg');
  });

  it('respects a custom base URL and strips a trailing slash', () => {
    const html = renderSocialLinks({ linkedin: 'jane' }, { style: 'light', baseUrl: '/local/icons/' });
    expect(html).toContain('src="/local/icons/light/linkedin.png"');
  });

  it('ignores unknown platforms and empty values', () => {
    const html = renderSocialLinks({ bogus: 'x', github: '   ' }, { style: 'dark' });
    expect(html).toBe('');
  });
});

describe('templates escape malicious input', () => {
  const malicious: SignatureData = {
    fullName: '<img src=x onerror=alert(1)>',
    jobTitle: '"><script>alert(2)</script>',
    company: 'Acme "Corp"',
    phone: '123',
    email: 'a@b.com',
    website: 'example.com',
    socials: { github: 'octocat' },
    logoUrl: 'javascript:alert(3)',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    fontFamily: 'Inter',
    iconStyle: 'brand',
  };

  for (const template of templates) {
    it(`${template.id} does not emit unescaped tags or javascript: URLs`, () => {
      const html = template.render(malicious);
      // The raw input markup must be neutralized into entities, not emitted as tags.
      expect(html).not.toContain('<script');
      expect(html).not.toContain('<img src=x');
      // javascript: must never survive in an href/src attribute.
      expect(html).not.toContain('href="javascript:');
      expect(html).not.toContain('src="javascript:');
      // The escaped form should be present, proving the value was rendered safely.
      expect(html).toContain('&lt;');
    });
  }
});
