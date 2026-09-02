import { describe, expect, it } from 'vitest';
import { parseSignatureData, parseSharedConfig } from './parseConfig';
import { defaultData } from '../data/defaults';
import { sampleData } from '../data/sampleData';
import { LIMITS } from '../data/options';

describe('parseSignatureData', () => {
  it('returns the defaults for anything that is not an object', () => {
    for (const input of [null, undefined, 42, 'text', [], true]) {
      expect(parseSignatureData(input)).toEqual(defaultData);
    }
  });

  it('passes a valid config through unchanged', () => {
    expect(parseSignatureData(sampleData)).toEqual(sampleData);
    expect(parseSignatureData(defaultData)).toEqual(defaultData);
  });

  it('fills missing fields from the defaults', () => {
    const out = parseSignatureData({ fullName: 'Jane' });
    expect(out).toEqual({ ...defaultData, fullName: 'Jane' });
  });

  it('coerces wrong types to safe values instead of throwing', () => {
    const out = parseSignatureData({
      socials: null,
      socialOrder: 'abc',
      fullName: 42,
      jobTitle: { nested: true },
      primaryColor: ['#fff'],
    });
    expect(out.socials).toEqual({});
    expect(out.socialOrder).toEqual(defaultData.socialOrder);
    expect(out.fullName).toBe('');
    expect(out.jobTitle).toBe('');
    expect(out.primaryColor).toBe(defaultData.primaryColor);
  });

  it('drops unknown keys, unknown platforms and inherited property names', () => {
    const out = parseSignatureData({
      evil: 'x',
      socials: { github: 'a', bogus: 'b', constructor: 'c', linkedin: 7 },
      socialOrder: ['constructor', 'github', 'github', 'nope', 3],
    });
    expect(Object.keys(out)).toEqual(Object.keys(defaultData));
    expect(out.socials).toEqual({ github: 'a' });
    expect(out.socialOrder).toEqual(['github']);
  });

  it('falls back on hostile or unknown enum and color values', () => {
    const out = parseSignatureData({
      iconStyle: 'x" onerror="alert(document.domain)//',
      fontFamily: 'Inter; background: url(https://attacker.example/p.gif)',
      primaryColor: 'red; background: url(x)',
      secondaryColor: '#12345',
    });
    expect(out.iconStyle).toBe(defaultData.iconStyle);
    expect(out.fontFamily).toBe(defaultData.fontFamily);
    expect(out.primaryColor).toBe(defaultData.primaryColor);
    expect(out.secondaryColor).toBe(defaultData.secondaryColor);
  });

  it('accepts three- and six-digit hex colors in either case', () => {
    expect(parseSignatureData({ primaryColor: '#ABC' }).primaryColor).toBe('#ABC');
    expect(parseSignatureData({ primaryColor: '#0f172a' }).primaryColor).toBe('#0f172a');
  });

  it('caps text lengths', () => {
    const long = 'a'.repeat(10_000);
    const out = parseSignatureData({ fullName: long, address: long, disclaimer: long, website: long, socials: { github: long } });
    expect(out.fullName).toHaveLength(LIMITS.text);
    expect(out.address).toHaveLength(LIMITS.address);
    expect(out.disclaimer).toHaveLength(LIMITS.disclaimer);
    expect(out.website).toHaveLength(LIMITS.url);
    expect(out.socials.github).toHaveLength(LIMITS.url);
  });

  it('drops an oversized logo rather than truncating it', () => {
    const huge = 'data:image/png;base64,' + 'A'.repeat(LIMITS.logoUrl);
    expect(parseSignatureData({ logoUrl: huge }).logoUrl).toBe('');
  });

  it('keeps image logo URLs and drops other schemes', () => {
    expect(parseSignatureData({ logoUrl: 'https://x.com/a.png' }).logoUrl).toBe('https://x.com/a.png');
    expect(parseSignatureData({ logoUrl: 'data:image/png;base64,AAA' }).logoUrl).toBe('data:image/png;base64,AAA');
    expect(parseSignatureData({ logoUrl: 'example.com/logo.png' }).logoUrl).toBe('example.com/logo.png');
    expect(parseSignatureData({ logoUrl: 'javascript:alert(1)' }).logoUrl).toBe('');
    expect(parseSignatureData({ logoUrl: 'data:text/html,<script>' }).logoUrl).toBe('');
  });

  it('does not pollute Object.prototype', () => {
    parseSignatureData(JSON.parse('{"__proto__":{"polluted":true},"socials":{"__proto__":{"polluted":true}}}'));
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('parseSharedConfig', () => {
  it('returns null when there is no data object', () => {
    expect(parseSharedConfig(null)).toBeNull();
    expect(parseSharedConfig('x')).toBeNull();
    expect(parseSharedConfig({})).toBeNull();
    expect(parseSharedConfig({ data: 'x' })).toBeNull();
    expect(parseSharedConfig({ data: [] })).toBeNull();
  });

  it('keeps a known template id and drops an unknown one', () => {
    expect(parseSharedConfig({ data: {}, templateId: 'minimal' })).toEqual({ data: defaultData, templateId: 'minimal' });
    expect(parseSharedConfig({ data: {}, templateId: 'nope' })).toEqual({ data: defaultData });
    expect(parseSharedConfig({ data: {}, templateId: 42 })).toEqual({ data: defaultData });
  });

  it('validates the nested data', () => {
    const out = parseSharedConfig({ data: { iconStyle: '"><img src=x onerror=alert(1)>', socials: { github: 'a' } } });
    expect(out?.data.iconStyle).toBe('brand');
    expect(out?.data.socials).toEqual({ github: 'a' });
  });
});
