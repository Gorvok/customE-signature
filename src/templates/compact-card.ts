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

export const compactCard: SignatureTemplate = {
  id: 'compact-card',
  name: 'Compact Card',
  description: 'Space-efficient card with rounded photo area',
  render: (data: SignatureData, options = {}) => {
    const accent = esc(data.primaryColor);
    const font = esc(data.fontFamily);
    const textDark = '#333333';
    const textLight = '#888888';

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 14,
      cellStyle: 'padding-right: 5px;',
      baseUrl: options.iconBaseUrl,
    });

    const logoSrc = sanitizeImageUrl(data.logoUrl);
    const logoHtml = logoSrc
      ? `<td style="vertical-align: middle; padding-right: 12px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; overflow: hidden; border: 2px solid ${accent};">
            <img src="${logoSrc}" width="52" height="52" style="width: 52px; height: 52px; object-fit: cover; display: block;" alt="Logo" />
          </div>
        </td>`
      : '';

    const role = [roleLine(data.jobTitle, data.department), data.company ? esc(data.company) : ''].filter(Boolean).join(' &bull; ');

    const contactParts: string[] = [];
    if (data.phone) contactParts.push(`<a href="${sanitizeLinkUrl(`tel:${telDigits(data.phone)}`)}" style="color: ${textLight}; text-decoration: none;">${esc(data.phone)}</a>`);
    if (data.email) contactParts.push(`<a href="${sanitizeLinkUrl(`mailto:${data.email}`)}" style="color: ${textLight}; text-decoration: none;">${esc(data.email)}</a>`);
    if (data.website) contactParts.push(`<a href="${sanitizeLinkUrl(normalizeWebsite(data.website))}" style="color: ${accent}; text-decoration: none; font-weight: 500;">${esc(displayWebsite(data.website))}</a>`);
    if (data.bookingLink) contactParts.push(`<a href="${sanitizeLinkUrl(normalizeWebsite(data.bookingLink))}" style="color: ${accent}; text-decoration: none; font-weight: 500;">Book a meeting</a>`);

    const cta = renderCtaButton(data.ctaLabel, data.ctaUrl, { bg: data.primaryColor, fg: '#FFFFFF', font: data.fontFamily });

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${font}, sans-serif; border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px; border-left: 3px solid ${accent};">
  <tr>
    ${logoHtml}
    <td style="vertical-align: middle;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size: 15px; font-weight: bold; color: ${textDark}; font-family: ${font}, sans-serif; line-height: 1.2;">${esc(data.fullName) || 'Your Name'}${data.pronouns ? ` <span style="font-size: 11px; font-weight: normal; color: ${textLight};">(${esc(data.pronouns)})</span>` : ''}</td>
        </tr>
        ${role ? `<tr><td style="font-size: 11px; color: ${textLight}; font-family: ${font}, sans-serif; padding-top: 1px;">${role}</td></tr>` : ''}
        ${data.address ? `<tr><td style="font-size: 11px; color: ${textLight}; font-family: ${font}, sans-serif; padding-top: 1px;">${esc(data.address)}</td></tr>` : ''}
        ${contactParts.length ? `<tr><td style="font-size: 11px; font-family: ${font}, sans-serif; padding-top: 4px;">${contactParts.join(' &nbsp;| ')}</td></tr>` : ''}
        ${cta ? `<tr><td style="padding-top: 8px;">${cta}</td></tr>` : ''}
        ${socialLinks ? `<tr><td style="padding-top: 5px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>
${renderDisclaimer(data.disclaimer, data.fontFamily)}`);
  },
};
