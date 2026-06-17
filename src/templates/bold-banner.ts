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

export const boldBanner: SignatureTemplate = {
  id: 'bold-banner',
  name: 'Bold Banner',
  description: 'Eye-catching colored banner with large name',
  render: (data: SignatureData) => {
    const bg = esc(data.primaryColor);
    const fg = esc(data.secondaryColor || '#FFFFFF');
    const font = esc(data.fontFamily);

    const socialLinks = renderSocialLinks(data.socials, { color: '#666666', size: 16 });

    const logoSrc = sanitizeImageUrl(data.logoUrl);
    const logoHtml = logoSrc
      ? `<td style="padding-right: 14px; vertical-align: middle;"><img src="${logoSrc}" width="50" style="width: 50px; display: block; border-radius: 50%;" alt="Logo" /></td>`
      : '';

    const contactParts: string[] = [];
    if (data.phone) contactParts.push(`<a href="${sanitizeLinkUrl(`tel:${telDigits(data.phone)}`)}" style="color: #555555; text-decoration: none; font-size: 12px;">${esc(data.phone)}</a>`);
    if (data.email) contactParts.push(`<a href="${sanitizeLinkUrl(`mailto:${data.email}`)}" style="color: #555555; text-decoration: none; font-size: 12px;">${esc(data.email)}</a>`);
    if (data.website) contactParts.push(`<a href="${sanitizeLinkUrl(normalizeWebsite(data.website))}" style="color: #555555; text-decoration: none; font-size: 12px;">${esc(displayWebsite(data.website))}</a>`);

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${font}, sans-serif; border-collapse: collapse;">
  <tr>
    <td colspan="2" style="background-color: ${bg}; padding: 16px 20px; border-radius: 6px 6px 0 0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${logoHtml}
          <td style="vertical-align: middle;">
            <span style="font-size: 22px; font-weight: bold; color: ${fg}; font-family: ${font}, sans-serif; letter-spacing: 0.5px;">${esc(data.fullName) || 'Your Name'}</span>
            ${data.jobTitle ? `<br /><span style="font-size: 13px; color: ${fg}; opacity: 0.85; font-family: ${font}, sans-serif;">${esc(data.jobTitle)}${data.company ? ` at ${esc(data.company)}` : ''}</span>` : data.company ? `<br /><span style="font-size: 13px; color: ${fg}; opacity: 0.85; font-family: ${font}, sans-serif;">${esc(data.company)}</span>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 20px; background-color: #f8f8f8; border-radius: 0 0 6px 6px; border: 1px solid #e8e8e8; border-top: none;">
      ${contactParts.length ? `<div style="font-size: 12px; line-height: 1.8; font-family: ${font}, sans-serif;">${contactParts.join(' &nbsp;&middot;&nbsp; ')}</div>` : ''}
      ${socialLinks ? `<table cellpadding="0" cellspacing="0" border="0" style="padding-top: 6px;"><tr>${socialLinks}</tr></table>` : ''}
    </td>
  </tr>
</table>`;
  },
};
