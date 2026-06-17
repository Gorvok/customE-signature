import type { SignatureData, SignatureTemplate } from '../types';
import {
  esc,
  sanitizeImageUrl,
  sanitizeLinkUrl,
  normalizeWebsite,
  displayWebsite,
  telDigits,
  renderSocialLinks,
} from '../utils/templateHelpers';

export const modernLight: SignatureTemplate = {
  id: 'modern-light',
  name: 'Modern Light',
  description: 'Clean light theme with accent color bar',
  render: (data: SignatureData, options = {}) => {
    const accentColor = esc(data.primaryColor);
    const font = esc(data.fontFamily);
    const textColor = '#333333';

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 18,
      baseUrl: options.iconBaseUrl,
    });

    const logoSrc = sanitizeImageUrl(data.logoUrl);
    const logoHtml = logoSrc
      ? `<td style="padding-right: 15px; vertical-align: middle;"><img src="${logoSrc}" width="70" style="width: 70px; display: block; border-radius: 4px;" alt="Logo" /></td>`
      : '';

    const contactParts: string[] = [];
    if (data.phone) contactParts.push(`<a href="${sanitizeLinkUrl(`tel:${telDigits(data.phone)}`)}" style="color: ${textColor}; text-decoration: none; font-size: 12px;">${esc(data.phone)}</a>`);
    if (data.email) contactParts.push(`<a href="${sanitizeLinkUrl(`mailto:${data.email}`)}" style="color: ${textColor}; text-decoration: none; font-size: 12px;">${esc(data.email)}</a>`);
    if (data.website) contactParts.push(`<a href="${sanitizeLinkUrl(normalizeWebsite(data.website))}" style="color: ${textColor}; text-decoration: none; font-size: 12px;">${esc(displayWebsite(data.website))}</a>`);

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${font}, sans-serif; border-top: 3px solid ${accentColor}; padding-top: 12px;">
  <tr>
    ${logoHtml}
    <td style="vertical-align: top;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size: 18px; font-weight: bold; color: ${textColor}; font-family: ${font}, sans-serif;">${esc(data.fullName) || 'Your Name'}</td>
        </tr>
        ${data.jobTitle || data.company ? `<tr><td style="font-size: 12px; color: ${accentColor}; font-family: ${font}, sans-serif; padding-top: 2px;">${[data.jobTitle, data.company].filter(Boolean).map(esc).join(' | ')}</td></tr>` : ''}
        ${contactParts.length ? `<tr><td style="padding-top: 6px; font-family: ${font}, sans-serif;">${contactParts.join(' &nbsp;|&nbsp; ')}</td></tr>` : ''}
        ${socialLinks ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>`;
  },
};
