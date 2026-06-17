import type { SignatureData } from '../types';
import { socialPlatforms } from './socialPlatforms';

/** A realistic, ready-to-look-at signature for the "Load sample" action. */
export const sampleData: SignatureData = {
  fullName: 'Alex Rivera',
  pronouns: 'they/them',
  jobTitle: 'Head of Product',
  department: 'Product',
  company: 'Northwind Labs',
  phone: '+1 (415) 555-0123',
  email: 'alex@northwind.io',
  website: 'northwind.io',
  address: '500 Market St, San Francisco, CA',
  bookingLink: 'cal.com/alex',
  socials: {
    linkedin: 'alexrivera',
    twitter: 'alexrivera',
    github: 'alexrivera',
    instagram: 'alex.builds',
  },
  socialOrder: socialPlatforms.map((p) => p.id),
  logoUrl: '',
  ctaLabel: 'Book a demo',
  ctaUrl: 'northwind.io/demo',
  disclaimer:
    'This email and any attachments are confidential and intended solely for the addressee. If you are not the intended recipient, please notify the sender and delete this message.',
  primaryColor: '#0f172a',
  secondaryColor: '#f8fafc',
  fontFamily: 'Inter',
  iconStyle: 'light',
};
