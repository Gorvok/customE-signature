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

export const boldBanner: SignatureTemplate = {
  id: 'bold-banner',
  name: 'Bold Banner',
  description: 'Eye-catching colored banner with large name',
  render: (data: SignatureData) => {
    const bg = data.primaryColor;
    const fg = data.secondaryColor || '#FFFFFF';

    const socialLinks = Object.entries(data.socials)
      .filter(([, val]) => val.trim())
      .map(([platform, value]) => {
        const url = buildSocialUrl(platform, value);
        const iconUri = getSocialIconDataUri(platform, '#666666');
        return `<td style="padding-right: 6px;"><a href="${url}" target="_blank" rel="noopener" style="text-decoration: none;"><img src="${iconUri}" width="16" height="16" alt="${platform}" style="display: block; width: 16px; height: 16px;" /></a></td>`;
      })
      .join('');

    const logoHtml = data.logoUrl
      ? `<td style="padding-right: 14px; vertical-align: middle;"><img src="${data.logoUrl}" width="50" style="width: 50px; display: block; border-radius: 50%;" alt="Logo" /></td>`
      : '';

    const contactParts: string[] = [];
    if (data.phone) contactParts.push(`<a href="tel:${data.phone.replace(/[^+\d]/g, '')}" style="color: #555555; text-decoration: none; font-size: 12px;">${data.phone}</a>`);
    if (data.email) contactParts.push(`<a href="mailto:${data.email}" style="color: #555555; text-decoration: none; font-size: 12px;">${data.email}</a>`);
    if (data.website) contactParts.push(`<a href="${data.website.startsWith('http') ? data.website : 'https://' + data.website}" style="color: #555555; text-decoration: none; font-size: 12px;">${data.website.replace(/^https?:\/\//, '')}</a>`);

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${data.fontFamily}, sans-serif; border-collapse: collapse;">
  <tr>
    <td colspan="2" style="background-color: ${bg}; padding: 16px 20px; border-radius: 6px 6px 0 0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${logoHtml}
          <td style="vertical-align: middle;">
            <span style="font-size: 22px; font-weight: bold; color: ${fg}; font-family: ${data.fontFamily}, sans-serif; letter-spacing: 0.5px;">${data.fullName || 'Your Name'}</span>
            ${data.jobTitle ? `<br /><span style="font-size: 13px; color: ${fg}; opacity: 0.85; font-family: ${data.fontFamily}, sans-serif;">${data.jobTitle}${data.company ? ` at ${data.company}` : ''}</span>` : data.company ? `<br /><span style="font-size: 13px; color: ${fg}; opacity: 0.85; font-family: ${data.fontFamily}, sans-serif;">${data.company}</span>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 20px; background-color: #f8f8f8; border-radius: 0 0 6px 6px; border: 1px solid #e8e8e8; border-top: none;">
      ${contactParts.length ? `<div style="font-size: 12px; line-height: 1.8; font-family: ${data.fontFamily}, sans-serif;">${contactParts.join(' &nbsp;&middot;&nbsp; ')}</div>` : ''}
      ${socialLinks ? `<table cellpadding="0" cellspacing="0" border="0" style="padding-top: 6px;"><tr>${socialLinks}</tr></table>` : ''}
    </td>
  </tr>
</table>`;
  },
};
