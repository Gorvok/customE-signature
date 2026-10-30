import { describe, expect, it } from 'vitest';
import { getSocialIconSvg } from './socialIcons';

describe('getSocialIconSvg', () => {
  it('returns an SVG for a known platform and nothing for an unknown one', () => {
    expect(getSocialIconSvg('github', 'currentColor')).toContain('<svg');
    expect(getSocialIconSvg('not-a-platform', 'currentColor')).toBe('');
  });

  it('substitutes simple color tokens', () => {
    expect(getSocialIconSvg('github', 'currentColor')).toContain('stroke="currentColor"');
    expect(getSocialIconSvg('github', '#2563eb')).toContain('stroke="#2563eb"');
    expect(getSocialIconSvg('github', '#fff')).toContain('stroke="#fff"');
  });

  it('falls back for hex values of an invalid length', () => {
    // 5 and 7 digits are not CSS colors; only 3, 4, 6 and 8 are.
    expect(getSocialIconSvg('github', '#12345')).toContain('stroke="currentColor"');
    expect(getSocialIconSvg('github', '#1234567')).toContain('stroke="currentColor"');
  });

  it('falls back to currentColor for values that could break out of the attribute', () => {
    for (const hostile of ['"><script>alert(1)</script>', 'red" onload="x', 'url(javascript:alert(1))', 'a b']) {
      const svg = getSocialIconSvg('github', hostile);
      expect(svg).toContain('stroke="currentColor"');
      expect(svg).not.toContain('<script');
      expect(svg).not.toContain('onload');
    }
  });

  it('leaves no placeholder behind', () => {
    expect(getSocialIconSvg('linkedin', '#000')).not.toContain('__COLOR__');
  });
});
