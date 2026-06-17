import type { SignatureData, SignatureTemplate } from '../types';
import {
  esc,
  sanitizeLinkUrl,
  normalizeWebsite,
  displayWebsite,
  telDigits,
  renderSocialLinks,
} from '../utils/templateHelpers';

export const minimal: SignatureTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Simple, text-focused signature',
  render: (data: SignatureData) => {
    const textColor = esc(data.primaryColor);
    const font = esc(data.fontFamily);

    const socialLinks = renderSocialLinks(data.socials, { color: data.primaryColor, size: 16 });

    const contactParts: string[] = [];
    if (data.phone) contactParts.push(`<a href="${sanitizeLinkUrl(`tel:${telDigits(data.phone)}`)}" style="color: #666666; text-decoration: none;">${esc(data.phone)}</a>`);
    if (data.email) contactParts.push(`<a href="${sanitizeLinkUrl(`mailto:${data.email}`)}" style="color: #666666; text-decoration: none;">${esc(data.email)}</a>`);
    if (data.website) contactParts.push(`<a href="${sanitizeLinkUrl(normalizeWebsite(data.website))}" style="color: #666666; text-decoration: none;">${esc(displayWebsite(data.website))}</a>`);

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${font}, sans-serif; font-size: 13px;">
  <tr>
    <td>
      <strong style="color: ${textColor}; font-size: 14px;">${esc(data.fullName) || 'Your Name'}</strong>
      ${data.jobTitle || data.company ? `<br /><span style="color: #666666; font-size: 12px;">${[data.jobTitle, data.company].filter(Boolean).map(esc).join(', ')}</span>` : ''}
    </td>
  </tr>
  ${contactParts.length ? `<tr><td style="padding-top: 6px; font-size: 12px; color: #666666; line-height: 1.6;">${contactParts.join(' &middot; ')}</td></tr>` : ''}
  ${socialLinks ? `<tr><td style="padding-top: 6px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
</table>`;
  },
};
