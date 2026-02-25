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

export const corporate: SignatureTemplate = {
  id: 'corporate',
  name: 'Corporate',
  description: 'Professional enterprise style with left accent',
  render: (data: SignatureData) => {
    const accent = data.primaryColor;
    const textDark = '#2d2d2d';
    const textMuted = '#777777';

    const socialLinks = Object.entries(data.socials)
      .filter(([, val]) => val.trim())
      .map(([platform, value]) => {
        const url = buildSocialUrl(platform, value);
        const iconUri = getSocialIconDataUri(platform, accent);
        return `<td style="padding-right: 8px;"><a href="${url}" target="_blank" rel="noopener" style="text-decoration: none;"><img src="${iconUri}" width="16" height="16" alt="${platform}" style="display: block; width: 16px; height: 16px;" /></a></td>`;
      })
      .join('');

    const logoHtml = data.logoUrl
      ? `<tr><td style="padding-bottom: 10px;"><img src="${data.logoUrl}" width="90" style="width: 90px; display: block;" alt="Logo" /></td></tr>`
      : '';

    const contactRows: string[] = [];
    if (data.phone) contactRows.push(`<tr><td style="padding: 1px 0; font-size: 12px; color: ${textMuted}; font-family: ${data.fontFamily}, sans-serif;"><a href="tel:${data.phone.replace(/[^+\d]/g, '')}" style="color: ${textMuted}; text-decoration: none;">Tel: ${data.phone}</a></td></tr>`);
    if (data.email) contactRows.push(`<tr><td style="padding: 1px 0; font-size: 12px; color: ${textMuted}; font-family: ${data.fontFamily}, sans-serif;"><a href="mailto:${data.email}" style="color: ${textMuted}; text-decoration: none;">${data.email}</a></td></tr>`);
    if (data.website) contactRows.push(`<tr><td style="padding: 1px 0; font-size: 12px; color: ${textMuted}; font-family: ${data.fontFamily}, sans-serif;"><a href="${data.website.startsWith('http') ? data.website : 'https://' + data.website}" style="color: ${accent}; text-decoration: none;">${data.website.replace(/^https?:\/\//, '')}</a></td></tr>`);

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${data.fontFamily}, sans-serif;">
  <tr>
    <td style="width: 4px; background-color: ${accent}; border-radius: 2px;"></td>
    <td style="padding-left: 16px; vertical-align: top;">
      <table cellpadding="0" cellspacing="0" border="0">
        ${logoHtml}
        <tr>
          <td style="font-size: 18px; font-weight: bold; color: ${textDark}; font-family: ${data.fontFamily}, sans-serif; text-transform: uppercase; letter-spacing: 1px;">${data.fullName || 'Your Name'}</td>
        </tr>
        ${data.jobTitle ? `<tr><td style="font-size: 12px; color: ${accent}; font-family: ${data.fontFamily}, sans-serif; padding-top: 2px; font-weight: 600;">${data.jobTitle}</td></tr>` : ''}
        ${data.company ? `<tr><td style="font-size: 12px; color: ${textMuted}; font-family: ${data.fontFamily}, sans-serif; padding-top: 1px;">${data.company}</td></tr>` : ''}
        ${contactRows.length ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0">${contactRows.join('')}</table></td></tr>` : ''}
        ${socialLinks ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>`;
  },
};
