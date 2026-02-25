import type { SignatureData, SignatureTemplate } from '../types';
import { getSocialIconDataUri } from '../utils/socialIcons';
import { socialPlatforms } from '../data/socialPlatforms';

function buildSocialUrl(platformId: string, value: string): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  const platform = socialPlatforms.find((p) => p.id === platformId);
  if (!platform || !platform.urlPrefix) return value;
  return platform.urlPrefix + value;
}

export const classicDark: SignatureTemplate = {
  id: 'classic-dark',
  name: 'Classic Dark',
  description: 'Professional dark theme with two-column layout',
  render: (data: SignatureData) => {
    const socialLinks = Object.entries(data.socials)
      .filter(([, val]) => val.trim())
      .map(([platform, value]) => {
        const url = buildSocialUrl(platform, value);
        const iconUri = getSocialIconDataUri(platform, data.secondaryColor || '#FFFFFF');
        return `<td style="padding-right: 6px;"><a href="${url}" target="_blank" rel="noopener" style="text-decoration: none;"><img src="${iconUri}" width="18" height="18" alt="${platform}" style="display: block; width: 18px; height: 18px;" /></a></td>`;
      })
      .join('');

    const logoHtml = data.logoUrl
      ? `<tr><td style="padding-top: 10px;"><img src="${data.logoUrl}" width="100" style="width: 100px; display: block;" alt="Logo" /></td></tr>`
      : '';

    const phoneHtml = data.phone
      ? `<tr><td style="padding: 2px 0;"><a href="tel:${data.phone.replace(/[^+\d]/g, '')}" style="color: ${data.secondaryColor}; text-decoration: none; font-size: 12px; font-family: ${data.fontFamily}, sans-serif;">${data.phone}</a></td></tr>`
      : '';

    const emailHtml = data.email
      ? `<tr><td style="padding: 2px 0;"><a href="mailto:${data.email}" style="color: ${data.secondaryColor}; text-decoration: none; font-size: 12px; font-family: ${data.fontFamily}, sans-serif;">${data.email}</a></td></tr>`
      : '';

    const websiteHtml = data.website
      ? `<tr><td style="padding: 2px 0;"><a href="${data.website.startsWith('http') ? data.website : 'https://' + data.website}" style="color: ${data.secondaryColor}; text-decoration: none; font-size: 12px; font-family: ${data.fontFamily}, sans-serif;">${data.website.replace(/^https?:\/\//, '')}</a></td></tr>`
      : '';

    return `<table cellpadding="0" cellspacing="0" border="0" style="background-color: ${data.primaryColor}; border: 1px solid ${data.secondaryColor}; border-radius: 5px; padding: 25px; font-family: ${data.fontFamily}, sans-serif;">
  <tr>
    <td style="vertical-align: top; padding-right: 15px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-weight: bold; font-size: 20px; color: ${data.secondaryColor}; font-family: ${data.fontFamily}, sans-serif; white-space: nowrap;">${data.fullName || 'Your Name'}</td>
        </tr>
        ${data.jobTitle ? `<tr><td style="font-size: 12px; color: ${data.secondaryColor}; font-family: ${data.fontFamily}, sans-serif; padding-top: 2px;">${data.jobTitle}</td></tr>` : ''}
        ${logoHtml}
      </table>
    </td>
    <td style="border-left: 1px solid ${data.secondaryColor}; padding-left: 15px; vertical-align: top;">
      <table cellpadding="0" cellspacing="0" border="0">
        ${data.company ? `<tr><td style="font-weight: bold; font-size: 12px; color: ${data.secondaryColor}; font-family: ${data.fontFamily}, sans-serif; padding-bottom: 4px;">${data.company}</td></tr>` : ''}
        ${phoneHtml}
        ${emailHtml}
        ${websiteHtml}
      </table>
      ${socialLinks ? `<table cellpadding="0" cellspacing="0" border="0" style="padding-top: 8px;"><tr>${socialLinks}</tr></table>` : ''}
    </td>
  </tr>
</table>`;
  },
};
