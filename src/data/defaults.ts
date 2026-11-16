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
  // A logo by default, so nothing changes for a signature made before the
  // monogram existed; the form offers the swap.
  brandMark: 'logo',
  monogramText: '',
  ctaLabel: '',
  ctaUrl: '',
  disclaimer: '',
  primaryColor: '#000000',
  secondaryColor: '#FFFFFF',
  // Arial is what most recipients will actually see; Inter stays as an option.
  fontFamily: 'Arial',
  iconStyle: 'brand',
  // Off until asked for: a signature should not rewrite links by surprise.
  utmEnabled: false,
  utmSource: 'email',
  utmMedium: 'signature',
  utmCampaign: '',
};
