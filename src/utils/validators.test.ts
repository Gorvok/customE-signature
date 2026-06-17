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
});

describe('isLikelyUrl', () => {
  it('accepts URLs with or without a protocol', () => {
    expect(isLikelyUrl('example.com')).toBe(true);
    expect(isLikelyUrl('https://example.com/path')).toBe(true);
    expect(isLikelyUrl('calendly.com/you')).toBe(true);
  });

  it('rejects values without a dot or with spaces', () => {
    expect(isLikelyUrl('example')).toBe(false);
    expect(isLikelyUrl('not a url')).toBe(false);
    expect(isLikelyUrl('')).toBe(false);
  });
});
