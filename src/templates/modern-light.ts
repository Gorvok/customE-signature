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

export const modernLight: SignatureTemplate = {
  id: 'modern-light',
  name: 'Modern Light',
  description: 'Clean light theme with accent color bar',
  render: (data: SignatureData) => {
    const accentColor = data.primaryColor;
    const textColor = '#333333';

    const socialLinks = Object.entries(data.socials)
      .filter(([, val]) => val.trim())
      .map(([platform, value]) => {
        const url = buildSocialUrl(platform, value);
        const iconUri = getSocialIconDataUri(platform, accentColor);
        return `<td style="padding-right: 6px;"><a href="${url}" target="_blank" rel="noopener" style="text-decoration: none;"><img src="${iconUri}" width="18" height="18" alt="${platform}" style="display: block; width: 18px; height: 18px;" /></a></td>`;
      })
      .join('');

    const logoHtml = data.logoUrl
      ? `<td style="padding-right: 15px; vertical-align: middle;"><img src="${data.logoUrl}" width="70" style="width: 70px; display: block; border-radius: 4px;" alt="Logo" /></td>`
      : '';

    const contactParts: string[] = [];
    if (data.phone) contactParts.push(`<a href="tel:${data.phone.replace(/[^+\d]/g, '')}" style="color: ${textColor}; text-decoration: none; font-size: 12px;">${data.phone}</a>`);
    if (data.email) contactParts.push(`<a href="mailto:${data.email}" style="color: ${textColor}; text-decoration: none; font-size: 12px;">${data.email}</a>`);
    if (data.website) contactParts.push(`<a href="${data.website.startsWith('http') ? data.website : 'https://' + data.website}" style="color: ${textColor}; text-decoration: none; font-size: 12px;">${data.website.replace(/^https?:\/\//, '')}</a>`);

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${data.fontFamily}, sans-serif; border-top: 3px solid ${accentColor}; padding-top: 12px;">
  <tr>
    ${logoHtml}
    <td style="vertical-align: top;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size: 18px; font-weight: bold; color: ${textColor}; font-family: ${data.fontFamily}, sans-serif;">${data.fullName || 'Your Name'}</td>
        </tr>
        ${data.jobTitle || data.company ? `<tr><td style="font-size: 12px; color: ${accentColor}; font-family: ${data.fontFamily}, sans-serif; padding-top: 2px;">${[data.jobTitle, data.company].filter(Boolean).join(' | ')}</td></tr>` : ''}
        ${contactParts.length ? `<tr><td style="padding-top: 6px; font-family: ${data.fontFamily}, sans-serif;">${contactParts.join(' &nbsp;|&nbsp; ')}</td></tr>` : ''}
        ${socialLinks ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>`;
  },
};
