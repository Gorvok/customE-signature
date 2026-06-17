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

export const classicDark: SignatureTemplate = {
  id: 'classic-dark',
  name: 'Classic Dark',
  description: 'Professional dark theme with two-column layout',
  render: (data: SignatureData, options = {}) => {
    const primary = esc(data.primaryColor);
    const secondary = esc(data.secondaryColor || '#FFFFFF');
    const font = esc(data.fontFamily);

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 18,
      baseUrl: options.iconBaseUrl,
    });

    const logoSrc = sanitizeImageUrl(data.logoUrl);
    const logoHtml = logoSrc
      ? `<tr><td style="padding-top: 10px;"><img src="${logoSrc}" width="100" style="width: 100px; display: block;" alt="Logo" /></td></tr>`
      : '';

    const role = roleLine(data.jobTitle, data.department);
    const link = (label: string, href: string) =>
      `<tr><td style="padding: 2px 0;"><a href="${href}" style="color: ${secondary}; text-decoration: none; font-size: 12px; font-family: ${font}, sans-serif;">${label}</a></td></tr>`;

    const rows: string[] = [];
    if (data.phone) rows.push(link(esc(data.phone), sanitizeLinkUrl(`tel:${telDigits(data.phone)}`)));
    if (data.email) rows.push(link(esc(data.email), sanitizeLinkUrl(`mailto:${data.email}`)));
    if (data.website) rows.push(link(esc(displayWebsite(data.website)), sanitizeLinkUrl(normalizeWebsite(data.website))));
    if (data.bookingLink) rows.push(link('Book a meeting', sanitizeLinkUrl(normalizeWebsite(data.bookingLink))));
    if (data.address) rows.push(`<tr><td style="padding: 2px 0; color: ${secondary}; font-size: 12px; font-family: ${font}, sans-serif;">${esc(data.address)}</td></tr>`);

    const cta = renderCtaButton(data.ctaLabel, data.ctaUrl, {
      bg: data.secondaryColor || '#FFFFFF',
      fg: data.primaryColor,
      font: data.fontFamily,
    });

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" style="background-color: ${primary}; border: 1px solid ${secondary}; border-radius: 5px; padding: 25px; font-family: ${font}, sans-serif;">
  <tr>
    <td style="vertical-align: top; padding-right: 15px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-weight: bold; font-size: 20px; color: ${secondary}; font-family: ${font}, sans-serif; white-space: nowrap;">${esc(data.fullName) || 'Your Name'}${data.pronouns ? ` <span style="font-size: 12px; font-weight: normal; opacity: 0.8;">(${esc(data.pronouns)})</span>` : ''}</td>
        </tr>
        ${role ? `<tr><td style="font-size: 12px; color: ${secondary}; font-family: ${font}, sans-serif; padding-top: 2px;">${role}</td></tr>` : ''}
        ${logoHtml}
      </table>
    </td>
    <td style="border-left: 1px solid ${secondary}; padding-left: 15px; vertical-align: top;">
      <table cellpadding="0" cellspacing="0" border="0">
        ${data.company ? `<tr><td style="font-weight: bold; font-size: 12px; color: ${secondary}; font-family: ${font}, sans-serif; padding-bottom: 4px;">${esc(data.company)}</td></tr>` : ''}
        ${rows.join('')}
      </table>
      ${cta ? `<div style="padding-top: 10px;">${cta}</div>` : ''}
      ${socialLinks ? `<table cellpadding="0" cellspacing="0" border="0" style="padding-top: 8px;"><tr>${socialLinks}</tr></table>` : ''}
    </td>
  </tr>
</table>
${renderDisclaimer(data.disclaimer, data.fontFamily, secondary)}`);
  },
};
