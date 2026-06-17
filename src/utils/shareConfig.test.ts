import { describe, expect, it } from 'vitest';
import { encodeConfig, decodeConfig, type SharedConfig } from './shareConfig';
import type { SignatureData } from '../types';

const data: SignatureData = {
  fullName: 'Jane Doe — CEO 🚀',
  pronouns: 'she/her',
  jobTitle: 'CEO',
  department: 'Exec',
  company: 'Acme',
  phone: '555',
  email: 'jane@acme.com',
  website: 'acme.com',
  address: '1 Main St',
  bookingLink: 'cal.com/jane',
  socials: { github: 'jane' },
  socialOrder: ['github', 'linkedin'],
  logoUrl: '',
  ctaLabel: 'Book',
  ctaUrl: 'acme.com/book',
  disclaimer: 'Confidential',
  primaryColor: '#112233',
  secondaryColor: '#FFFFFF',
  fontFamily: 'Inter',
  iconStyle: 'brand',
};

describe('shareConfig', () => {
  it('round-trips a config including unicode', () => {
    const config: SharedConfig = { data, templateId: 'corporate' };
    const decoded = decodeConfig(encodeConfig(config));
    expect(decoded).toEqual(config);
  });

  it('produces a URL-safe string', () => {
    const encoded = encodeConfig({ data, templateId: 'minimal' });
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('returns null for malformed input', () => {
    expect(decodeConfig('not-valid-base64!!')).toBeNull();
    expect(decodeConfig('')).toBeNull();
  });
});
