import { describe, expect, it } from 'vitest';
import { isValidEmail, isLikelyUrl } from './validators';

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('jane@acme.com')).toBe(true);
    expect(isValidEmail('  jane.doe@sub.acme.co.uk ')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(isValidEmail('jane')).toBe(false);
    expect(isValidEmail('jane@acme')).toBe(false);
    expect(isValidEmail('jane @acme.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects trailing, leading or doubled dots in the domain', () => {
    expect(isValidEmail('jane@acme.com.')).toBe(false);
    expect(isValidEmail('jane@acme..com')).toBe(false);
    expect(isValidEmail('jane@.acme.com')).toBe(false);
  });
});

describe('isLikelyUrl', () => {
  it('accepts URLs with or without a protocol', () => {
    expect(isLikelyUrl('example.com')).toBe(true);
    expect(isLikelyUrl('https://example.com/path')).toBe(true);
    expect(isLikelyUrl('calendly.com/you')).toBe(true);
  });

  it('accepts an uppercase scheme and a port', () => {
    expect(isLikelyUrl('HTTPS://EXAMPLE.COM')).toBe(true);
    expect(isLikelyUrl('example.com:8080/x')).toBe(true);
  });

  it('rejects values without a dot or with spaces', () => {
    expect(isLikelyUrl('example')).toBe(false);
    expect(isLikelyUrl('not a url')).toBe(false);
    expect(isLikelyUrl('')).toBe(false);
  });

  it('rejects other schemes and quotes, which would become dead or unsafe links', () => {
    expect(isLikelyUrl('mailto:jane@acme.com')).toBe(false);
    expect(isLikelyUrl('javascript:alert(1)')).toBe(false);
    expect(isLikelyUrl('ftp://example.com')).toBe(false);
    expect(isLikelyUrl('a"b.com')).toBe(false);
  });
});
