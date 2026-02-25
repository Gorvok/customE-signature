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

export const elegant: SignatureTemplate = {
  id: 'elegant',
  name: 'Elegant',
  description: 'Refined style with centered layout and dividers',
  render: (data: SignatureData) => {
    const accent = data.primaryColor;
    const textColor = '#3a3a3a';
    const mutedColor = '#999999';

    const socialLinks = Object.entries(data.socials)
      .filter(([, val]) => val.trim())
      .map(([platform, value]) => {
        const url = buildSocialUrl(platform, value);
        const iconUri = getSocialIconDataUri(platform, accent);
        return `<td style="padding: 0 5px;"><a href="${url}" target="_blank" rel="noopener" style="text-decoration: none;"><img src="${iconUri}" width="16" height="16" alt="${platform}" style="display: block; width: 16px; height: 16px;" /></a></td>`;
      })
      .join('');

    const logoHtml = data.logoUrl
      ? `<tr><td align="center" style="padding-bottom: 10px;"><img src="${data.logoUrl}" width="60" style="width: 60px; display: block;" alt="Logo" /></td></tr>`
      : '';

    const contactParts: string[] = [];
    if (data.phone) contactParts.push(`<a href="tel:${data.phone.replace(/[^+\d]/g, '')}" style="color: ${mutedColor}; text-decoration: none;">${data.phone}</a>`);
    if (data.email) contactParts.push(`<a href="mailto:${data.email}" style="color: ${mutedColor}; text-decoration: none;">${data.email}</a>`);
    if (data.website) contactParts.push(`<a href="${data.website.startsWith('http') ? data.website : 'https://' + data.website}" style="color: ${mutedColor}; text-decoration: none;">${data.website.replace(/^https?:\/\//, '')}</a>`);

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Georgia, 'Times New Roman', ${data.fontFamily}, serif; text-align: center;">
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0" border="0">
        ${logoHtml}
        <tr>
          <td align="center" style="font-size: 20px; color: ${textColor}; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 2px;">${data.fullName || 'Your Name'}</td>
        </tr>
        ${data.jobTitle || data.company ? `<tr><td align="center" style="font-size: 11px; color: ${accent}; font-family: ${data.fontFamily}, sans-serif; padding-top: 4px; text-transform: uppercase; letter-spacing: 3px;">${[data.jobTitle, data.company].filter(Boolean).join('  &mdash;  ')}</td></tr>` : ''}
        <tr>
          <td align="center" style="padding-top: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="width: 40px; height: 1px; background-color: ${accent};"></td>
                <td style="width: 8px;"></td>
                <td style="width: 6px; height: 6px; border-radius: 50%; background-color: ${accent};"></td>
                <td style="width: 8px;"></td>
                <td style="width: 40px; height: 1px; background-color: ${accent};"></td>
              </tr>
            </table>
          </td>
        </tr>
        ${contactParts.length ? `<tr><td align="center" style="padding-top: 10px; font-size: 12px; color: ${mutedColor}; line-height: 1.8; font-family: ${data.fontFamily}, sans-serif;">${contactParts.join('<br />')}</td></tr>` : ''}
        ${socialLinks ? `<tr><td align="center" style="padding-top: 10px;"><table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>`;
  },
};
