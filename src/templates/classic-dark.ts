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

export const classicDark: SignatureTemplate = {
  id: 'classic-dark',
  name: 'Classic Dark',
  description: 'Professional dark theme with two-column layout',
  render: (data: SignatureData) => {
    const primary = esc(data.primaryColor);
    const secondary = esc(data.secondaryColor || '#FFFFFF');
    const font = esc(data.fontFamily);

    const socialLinks = renderSocialLinks(data.socials, {
      color: data.secondaryColor || '#FFFFFF',
      size: 18,
    });

    const logoSrc = sanitizeImageUrl(data.logoUrl);
    const logoHtml = logoSrc
      ? `<tr><td style="padding-top: 10px;"><img src="${logoSrc}" width="100" style="width: 100px; display: block;" alt="Logo" /></td></tr>`
      : '';

    const phoneHtml = data.phone
      ? `<tr><td style="padding: 2px 0;"><a href="${sanitizeLinkUrl(`tel:${telDigits(data.phone)}`)}" style="color: ${secondary}; text-decoration: none; font-size: 12px; font-family: ${font}, sans-serif;">${esc(data.phone)}</a></td></tr>`
      : '';

    const emailHtml = data.email
      ? `<tr><td style="padding: 2px 0;"><a href="${sanitizeLinkUrl(`mailto:${data.email}`)}" style="color: ${secondary}; text-decoration: none; font-size: 12px; font-family: ${font}, sans-serif;">${esc(data.email)}</a></td></tr>`
      : '';

    const websiteHtml = data.website
      ? `<tr><td style="padding: 2px 0;"><a href="${sanitizeLinkUrl(normalizeWebsite(data.website))}" style="color: ${secondary}; text-decoration: none; font-size: 12px; font-family: ${font}, sans-serif;">${esc(displayWebsite(data.website))}</a></td></tr>`
      : '';

    return `<table cellpadding="0" cellspacing="0" border="0" style="background-color: ${primary}; border: 1px solid ${secondary}; border-radius: 5px; padding: 25px; font-family: ${font}, sans-serif;">
  <tr>
    <td style="vertical-align: top; padding-right: 15px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-weight: bold; font-size: 20px; color: ${secondary}; font-family: ${font}, sans-serif; white-space: nowrap;">${esc(data.fullName) || 'Your Name'}</td>
        </tr>
        ${data.jobTitle ? `<tr><td style="font-size: 12px; color: ${secondary}; font-family: ${font}, sans-serif; padding-top: 2px;">${esc(data.jobTitle)}</td></tr>` : ''}
        ${logoHtml}
      </table>
    </td>
    <td style="border-left: 1px solid ${secondary}; padding-left: 15px; vertical-align: top;">
      <table cellpadding="0" cellspacing="0" border="0">
        ${data.company ? `<tr><td style="font-weight: bold; font-size: 12px; color: ${secondary}; font-family: ${font}, sans-serif; padding-bottom: 4px;">${esc(data.company)}</td></tr>` : ''}
        ${phoneHtml}
        ${emailHtml}
        ${websiteHtml}
      </table>
      ${socialLinks ? `<table cellpadding="0" cellspacing="0" border="0" style="padding-top: 8px;"><tr>${socialLinks}</tr></table>` : ''}
    </td>
  </tr>
</table>`;
  },
};
