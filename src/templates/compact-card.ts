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

export const compactCard: SignatureTemplate = {
  id: 'compact-card',
  name: 'Compact Card',
  description: 'Space-efficient card with rounded photo area',
  render: (data: SignatureData) => {
    const accent = data.primaryColor;
    const textDark = '#333333';
    const textLight = '#888888';

    const socialLinks = Object.entries(data.socials)
      .filter(([, val]) => val.trim())
      .map(([platform, value]) => {
        const url = buildSocialUrl(platform, value);
        const iconUri = getSocialIconDataUri(platform, accent);
        return `<td style="padding-right: 5px;"><a href="${url}" target="_blank" rel="noopener" style="text-decoration: none;"><img src="${iconUri}" width="14" height="14" alt="${platform}" style="display: block; width: 14px; height: 14px;" /></a></td>`;
      })
      .join('');

    const logoHtml = data.logoUrl
      ? `<td style="vertical-align: middle; padding-right: 12px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; overflow: hidden; border: 2px solid ${accent};">
            <img src="${data.logoUrl}" width="52" height="52" style="width: 52px; height: 52px; object-fit: cover; display: block;" alt="Logo" />
          </div>
        </td>`
      : '';

    const contactParts: string[] = [];
    if (data.phone) contactParts.push(`<a href="tel:${data.phone.replace(/[^+\d]/g, '')}" style="color: ${textLight}; text-decoration: none;">${data.phone}</a>`);
    if (data.email) contactParts.push(`<a href="mailto:${data.email}" style="color: ${textLight}; text-decoration: none;">${data.email}</a>`);
    if (data.website) contactParts.push(`<a href="${data.website.startsWith('http') ? data.website : 'https://' + data.website}" style="color: ${accent}; text-decoration: none; font-weight: 500;">${data.website.replace(/^https?:\/\//, '')}</a>`);

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${data.fontFamily}, sans-serif; border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px; border-left: 3px solid ${accent};">
  <tr>
    ${logoHtml}
    <td style="vertical-align: middle;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size: 15px; font-weight: bold; color: ${textDark}; font-family: ${data.fontFamily}, sans-serif; line-height: 1.2;">${data.fullName || 'Your Name'}</td>
        </tr>
        ${data.jobTitle || data.company ? `<tr><td style="font-size: 11px; color: ${textLight}; font-family: ${data.fontFamily}, sans-serif; padding-top: 1px;">${[data.jobTitle, data.company].filter(Boolean).join(' &bull; ')}</td></tr>` : ''}
        ${contactParts.length ? `<tr><td style="font-size: 11px; font-family: ${data.fontFamily}, sans-serif; padding-top: 4px;">${contactParts.join(' &nbsp;| ')}</td></tr>` : ''}
        ${socialLinks ? `<tr><td style="padding-top: 5px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>`;
  },
};
