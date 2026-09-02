import type { SignatureData } from '../types';
import { socialPlatforms } from './socialPlatforms';

/** The empty signature every session starts from and the validator falls back to. */
export const defaultData: SignatureData = {
  fullName: '',
  pronouns: '',
  jobTitle: '',
  department: '',
  company: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  bookingLink: '',
  socials: {},
  socialOrder: socialPlatforms.map((p) => p.id),
  logoUrl: '',
  ctaLabel: '',
  ctaUrl: '',
  disclaimer: '',
  primaryColor: '#000000',
  secondaryColor: '#FFFFFF',
  fontFamily: 'Inter',
  iconStyle: 'brand',
};
