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

export const corporate: SignatureTemplate = {
  id: 'corporate',
  name: 'Corporate',
  description: 'Professional enterprise style with left accent',
  render: (data: SignatureData) => {
    const accent = esc(data.primaryColor);
    const font = esc(data.fontFamily);
    const textDark = '#2d2d2d';
    const textMuted = '#777777';

    const socialLinks = renderSocialLinks(data.socials, {
      color: data.primaryColor,
      size: 16,
      cellStyle: 'padding-right: 8px;',
    });

    const logoSrc = sanitizeImageUrl(data.logoUrl);
    const logoHtml = logoSrc
      ? `<tr><td style="padding-bottom: 10px;"><img src="${logoSrc}" width="90" style="width: 90px; display: block;" alt="Logo" /></td></tr>`
      : '';

    const contactRows: string[] = [];
    if (data.phone) contactRows.push(`<tr><td style="padding: 1px 0; font-size: 12px; color: ${textMuted}; font-family: ${font}, sans-serif;"><a href="${sanitizeLinkUrl(`tel:${telDigits(data.phone)}`)}" style="color: ${textMuted}; text-decoration: none;">Tel: ${esc(data.phone)}</a></td></tr>`);
    if (data.email) contactRows.push(`<tr><td style="padding: 1px 0; font-size: 12px; color: ${textMuted}; font-family: ${font}, sans-serif;"><a href="${sanitizeLinkUrl(`mailto:${data.email}`)}" style="color: ${textMuted}; text-decoration: none;">${esc(data.email)}</a></td></tr>`);
    if (data.website) contactRows.push(`<tr><td style="padding: 1px 0; font-size: 12px; color: ${textMuted}; font-family: ${font}, sans-serif;"><a href="${sanitizeLinkUrl(normalizeWebsite(data.website))}" style="color: ${accent}; text-decoration: none;">${esc(displayWebsite(data.website))}</a></td></tr>`);

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${font}, sans-serif;">
  <tr>
    <td style="width: 4px; background-color: ${accent}; border-radius: 2px;"></td>
    <td style="padding-left: 16px; vertical-align: top;">
      <table cellpadding="0" cellspacing="0" border="0">
        ${logoHtml}
        <tr>
          <td style="font-size: 18px; font-weight: bold; color: ${textDark}; font-family: ${font}, sans-serif; text-transform: uppercase; letter-spacing: 1px;">${esc(data.fullName) || 'Your Name'}</td>
        </tr>
        ${data.jobTitle ? `<tr><td style="font-size: 12px; color: ${accent}; font-family: ${font}, sans-serif; padding-top: 2px; font-weight: 600;">${esc(data.jobTitle)}</td></tr>` : ''}
        ${data.company ? `<tr><td style="font-size: 12px; color: ${textMuted}; font-family: ${font}, sans-serif; padding-top: 1px;">${esc(data.company)}</td></tr>` : ''}
        ${contactRows.length ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0">${contactRows.join('')}</table></td></tr>` : ''}
        ${socialLinks ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>`;
  },
};
