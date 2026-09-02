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
  finalizeHtml,
  roleLine,
  renderCtaButton,
  renderDisclaimer,
  PRODUCTION_ICON_BASE,
} from './templateHelpers';
import { templates } from '../templates';
import { parseSignatureData } from './parseConfig';
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

  it('honors an explicit order and appends the rest', () => {
    const html = renderSocialLinks(
      { github: 'a', linkedin: 'b' },
      { style: 'brand', order: ['linkedin', 'github'] },
    );
    expect(html.indexOf('linkedin')).toBeLessThan(html.indexOf('github'));
  });
});

describe('finalizeHtml', () => {
  it('adds a presentation role to tables that lack one', () => {
    expect(finalizeHtml('<table cellpadding="0">')).toBe('<table role="presentation" cellpadding="0">');
  });

  it('leaves tables that already have a role untouched', () => {
    expect(finalizeHtml('<table role="presentation">')).toBe('<table role="presentation">');
  });
});

describe('roleLine', () => {
  it('joins title and department, dropping blanks', () => {
    expect(roleLine('CTO', 'Engineering')).toBe('CTO, Engineering');
    expect(roleLine('CTO', '')).toBe('CTO');
    expect(roleLine('', '')).toBe('');
  });

  it('escapes its parts', () => {
    expect(roleLine('<b>', '')).toBe('&lt;b&gt;');
  });
});

describe('renderCtaButton', () => {
  it('renders an escaped button with a safe href', () => {
    const html = renderCtaButton('Book', 'example.com/x', { bg: '#000', fg: '#fff', font: 'Inter' });
    expect(html).toContain('href="https://example.com/x"');
    expect(html).toContain('>Book<');
  });

  it('includes an Outlook VML fallback', () => {
    const html = renderCtaButton('Book', 'example.com/x', { bg: '#000', fg: '#fff', font: 'Inter' });
    expect(html).toContain('<!--[if mso]>');
    expect(html).toContain('v:roundrect');
  });

  it('returns empty when label or url is missing', () => {
    expect(renderCtaButton('', 'x', { bg: '#000', fg: '#fff', font: 'Inter' })).toBe('');
    expect(renderCtaButton('Go', '', { bg: '#000', fg: '#fff', font: 'Inter' })).toBe('');
  });

  it('neutralizes a javascript: url', () => {
    const html = renderCtaButton('Go', 'javascript:alert(1)', { bg: '#000', fg: '#fff', font: 'Inter' });
    expect(html).not.toContain('href="javascript:');
  });
});

describe('renderDisclaimer', () => {
  it('escapes text and returns empty when blank', () => {
    expect(renderDisclaimer('<script>', 'Inter')).toContain('&lt;script&gt;');
    expect(renderDisclaimer('   ', 'Inter')).toBe('');
  });
});

describe('templates escape malicious input', () => {
  const malicious: SignatureData = {
    fullName: '<img src=x onerror=alert(1)>',
    pronouns: '"><b>x</b>',
    jobTitle: '"><script>alert(2)</script>',
    department: '<i>dept</i>',
    company: 'Acme "Corp"',
    phone: '123',
    email: 'a@b.com',
    website: 'example.com',
    address: '<script>1</script> 1 Main St',
    bookingLink: 'javascript:alert(4)',
    socials: { github: 'octocat' },
    socialOrder: ['github'],
    logoUrl: 'javascript:alert(3)',
    ctaLabel: '<u>Click</u>',
    ctaUrl: 'javascript:alert(5)',
    disclaimer: 'Confidential <script>alert(6)</script>',
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

describe('sanitizeLinkUrl control-character bypasses', () => {
  const variants = [
    'java\nscript:alert(1)',
    'java\tscript:alert(1)',
    'java\rscript:alert(1)',
    '\u0001javascript:alert(1)',
    '\u0000javascript:alert(1)',
    ' javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
  ];

  for (const input of variants) {
    it(`rejects ${JSON.stringify(input)}`, () => {
      expect(sanitizeLinkUrl(input)).toBe('#');
    });
  }

  it('strips stray control characters from otherwise safe URLs', () => {
    expect(sanitizeLinkUrl('https://exam\nple.com/a')).toBe('https://example.com/a');
  });

  it('returns an empty string for empty input', () => {
    expect(sanitizeLinkUrl('')).toBe('');
    expect(sanitizeLinkUrl('  \n ')).toBe('');
  });
});

describe('normalizeWebsite', () => {
  it('leaves other schemes alone for the sanitizer to judge', () => {
    expect(normalizeWebsite('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(normalizeWebsite('javascript:alert(1)')).toBe('javascript:alert(1)');
  });

  it('keeps scheme-relative URLs and trims whitespace', () => {
    expect(normalizeWebsite('//cdn.example.com/x')).toBe('//cdn.example.com/x');
    expect(normalizeWebsite('  example.com  ')).toBe('https://example.com');
  });

  it('treats a host with a port as a host, not a scheme', () => {
    expect(normalizeWebsite('example.com:8080/x')).toBe('https://example.com:8080/x');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeWebsite('')).toBe('');
    expect(normalizeWebsite('   ')).toBe('');
  });
});

describe('buildSocialUrl', () => {
  it('gives the Website platform a scheme', () => {
    expect(buildSocialUrl('website', 'example.com')).toBe('https://example.com');
    expect(buildSocialUrl('website', 'https://example.com')).toBe('https://example.com');
  });

  it('strips a leading @ from handles and trims', () => {
    expect(buildSocialUrl('instagram', '@alex.builds')).toBe('https://www.instagram.com/alex.builds');
    expect(buildSocialUrl('github', '  octocat ')).toBe('https://github.com/octocat');
  });

  it('does not double-prefix a pasted profile path', () => {
    expect(buildSocialUrl('linkedin', 'linkedin.com/in/jane')).toBe('https://linkedin.com/in/jane');
    expect(buildSocialUrl('linkedin', 'www.linkedin.com/in/jane')).toBe('https://www.linkedin.com/in/jane');
  });

  it('keeps dotted handles as handles', () => {
    expect(buildSocialUrl('instagram', 'alex.builds')).toBe('https://www.instagram.com/alex.builds');
  });

  it('never lets a hidden scheme through the Website platform', () => {
    expect(sanitizeLinkUrl(buildSocialUrl('website', 'java\nscript:alert(document.domain)'))).toBe('#');
  });
});

describe('renderSocialLinks hardening', () => {
  it('coerces an unknown icon style and escapes the icon URL', () => {
    const html = renderSocialLinks({ github: 'x' }, { style: 'x" onerror="alert(document.domain)//' as never });
    expect(html).not.toMatch(/\sonerror=/);
    expect(html).toContain(`src="${PRODUCTION_ICON_BASE}/brand/github.png"`);
  });

  it('does not throw on junk shapes', () => {
    expect(renderSocialLinks(null as never, { style: 'brand' })).toBe('');
    expect(renderSocialLinks({ github: 'x' }, { style: 'brand', order: 'abc' as never })).toContain('github.png');
    expect(renderSocialLinks({ github: 'x' }, { style: 'brand', order: ['constructor'] })).toContain('github.png');
    expect(renderSocialLinks({ github: 7 as never }, { style: 'brand' })).toBe('');
  });
});

describe('templates neutralize hostile config values after parsing', () => {
  // Exactly what a crafted share link or JSON file would deliver.
  const hostile = {
    fullName: 'Alex',
    socials: { github: 'x', website: 'java\tscript:alert(document.domain)' },
    iconStyle: 'x" onerror="alert(document.domain)//',
    fontFamily: 'Inter; background: url(https://attacker.example/p.gif)',
    primaryColor: 'red; background: url(x)',
    secondaryColor: '#fff"><script>alert(1)</script>',
    ctaLabel: 'Go',
    ctaUrl: 'x',
    disclaimer: 'd',
  };

  for (const template of templates) {
    it(`${template.id} emits no handlers, scripts or CSS URLs`, () => {
      const html = template.render(parseSignatureData(hostile));
      expect(html).not.toMatch(/\son[a-z]+=/i);
      expect(html).not.toContain('<script');
      expect(html).not.toContain('url(');
      expect(html).not.toMatch(/href="[^"]*javascript:/i);
      expect(html).toContain('/brand/github.png');
    });
  }
});
