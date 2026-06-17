import type { SignatureData, SignatureTemplate } from '../types';
import {
  esc,
  finalizeHtml,
  roleLine,
  renderCtaButton,
  renderDisclaimer,
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
  render: (data: SignatureData, options = {}) => {
    const accent = esc(data.primaryColor);
    const font = esc(data.fontFamily);
    const textDark = '#2d2d2d';
    const textMuted = '#777777';

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 16,
      cellStyle: 'padding-right: 8px;',
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    const logoSrc = sanitizeImageUrl(data.logoUrl);
    const logoHtml = logoSrc
      ? `<tr><td style="padding-bottom: 10px;"><img src="${logoSrc}" width="90" style="width: 90px; display: block;" alt="Logo" /></td></tr>`
      : '';

    const role = roleLine(data.jobTitle, data.department);
    const muted = (inner: string) =>
      `<tr><td style="padding: 1px 0; font-size: 12px; color: ${textMuted}; font-family: ${font}, sans-serif;">${inner}</td></tr>`;

    const contactRows: string[] = [];
    if (data.phone) contactRows.push(muted(`<a href="${sanitizeLinkUrl(`tel:${telDigits(data.phone)}`)}" style="color: ${textMuted}; text-decoration: none;">Tel: ${esc(data.phone)}</a>`));
    if (data.email) contactRows.push(muted(`<a href="${sanitizeLinkUrl(`mailto:${data.email}`)}" style="color: ${textMuted}; text-decoration: none;">${esc(data.email)}</a>`));
    if (data.website) contactRows.push(muted(`<a href="${sanitizeLinkUrl(normalizeWebsite(data.website))}" style="color: ${accent}; text-decoration: none;">${esc(displayWebsite(data.website))}</a>`));
    if (data.bookingLink) contactRows.push(muted(`<a href="${sanitizeLinkUrl(normalizeWebsite(data.bookingLink))}" style="color: ${accent}; text-decoration: none; font-weight: 600;">Book a meeting</a>`));
    if (data.address) contactRows.push(muted(esc(data.address)));

    const cta = renderCtaButton(data.ctaLabel, data.ctaUrl, { bg: data.primaryColor, fg: '#FFFFFF', font: data.fontFamily });

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${font}, sans-serif;">
  <tr>
    <td style="width: 4px; background-color: ${accent}; border-radius: 2px;"></td>
    <td style="padding-left: 16px; vertical-align: top;">
      <table cellpadding="0" cellspacing="0" border="0">
        ${logoHtml}
        <tr>
          <td style="font-size: 18px; font-weight: bold; color: ${textDark}; font-family: ${font}, sans-serif; text-transform: uppercase; letter-spacing: 1px;">${esc(data.fullName) || 'Your Name'}${data.pronouns ? ` <span style="font-size: 12px; font-weight: normal; text-transform: none; letter-spacing: 0; color: ${textMuted};">(${esc(data.pronouns)})</span>` : ''}</td>
        </tr>
        ${role ? `<tr><td style="font-size: 12px; color: ${accent}; font-family: ${font}, sans-serif; padding-top: 2px; font-weight: 600;">${role}</td></tr>` : ''}
        ${data.company ? `<tr><td style="font-size: 12px; color: ${textMuted}; font-family: ${font}, sans-serif; padding-top: 1px;">${esc(data.company)}</td></tr>` : ''}
        ${contactRows.length ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0">${contactRows.join('')}</table></td></tr>` : ''}
        ${cta ? `<tr><td style="padding-top: 10px;">${cta}</td></tr>` : ''}
        ${socialLinks ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>
${renderDisclaimer(data.disclaimer, data.fontFamily)}`);
  },
};
