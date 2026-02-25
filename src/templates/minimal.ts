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

export const minimal: SignatureTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Simple, text-focused signature',
  render: (data: SignatureData) => {
    const textColor = data.primaryColor;

    const socialLinks = Object.entries(data.socials)
      .filter(([, val]) => val.trim())
      .map(([platform, value]) => {
        const url = buildSocialUrl(platform, value);
        const iconUri = getSocialIconDataUri(platform, textColor);
        return `<td style="padding-right: 6px;"><a href="${url}" target="_blank" rel="noopener" style="text-decoration: none;"><img src="${iconUri}" width="16" height="16" alt="${platform}" style="display: block; width: 16px; height: 16px;" /></a></td>`;
      })
      .join('');

    const contactParts: string[] = [];
    if (data.phone) contactParts.push(`<a href="tel:${data.phone.replace(/[^+\d]/g, '')}" style="color: #666666; text-decoration: none;">${data.phone}</a>`);
    if (data.email) contactParts.push(`<a href="mailto:${data.email}" style="color: #666666; text-decoration: none;">${data.email}</a>`);
    if (data.website) contactParts.push(`<a href="${data.website.startsWith('http') ? data.website : 'https://' + data.website}" style="color: #666666; text-decoration: none;">${data.website.replace(/^https?:\/\//, '')}</a>`);

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${data.fontFamily}, sans-serif; font-size: 13px;">
  <tr>
    <td>
      <strong style="color: ${textColor}; font-size: 14px;">${data.fullName || 'Your Name'}</strong>
      ${data.jobTitle || data.company ? `<br /><span style="color: #666666; font-size: 12px;">${[data.jobTitle, data.company].filter(Boolean).join(', ')}</span>` : ''}
    </td>
  </tr>
  ${contactParts.length ? `<tr><td style="padding-top: 6px; font-size: 12px; color: #666666; line-height: 1.6;">${contactParts.join(' &middot; ')}</td></tr>` : ''}
  ${socialLinks ? `<tr><td style="padding-top: 6px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
</table>`;
  },
};
