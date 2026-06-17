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

export const elegant: SignatureTemplate = {
  id: 'elegant',
  name: 'Elegant',
  description: 'Refined style with centered layout and dividers',
  render: (data: SignatureData, options = {}) => {
    const accent = esc(data.primaryColor);
    const font = esc(data.fontFamily);
    const textColor = '#3a3a3a';
    const mutedColor = '#999999';

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 16,
      cellStyle: 'padding: 0 5px;',
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    const logoSrc = sanitizeImageUrl(data.logoUrl);
    const logoHtml = logoSrc
      ? `<tr><td align="center" style="padding-bottom: 10px;"><img src="${logoSrc}" width="60" style="width: 60px; display: block;" alt="Logo" /></td></tr>`
      : '';

    const role = [roleLine(data.jobTitle, data.department), data.company ? esc(data.company) : ''].filter(Boolean).join('  &mdash;  ');

    const contactParts: string[] = [];
    if (data.phone) contactParts.push(`<a href="${sanitizeLinkUrl(`tel:${telDigits(data.phone)}`)}" style="color: ${mutedColor}; text-decoration: none;">${esc(data.phone)}</a>`);
    if (data.email) contactParts.push(`<a href="${sanitizeLinkUrl(`mailto:${data.email}`)}" style="color: ${mutedColor}; text-decoration: none;">${esc(data.email)}</a>`);
    if (data.website) contactParts.push(`<a href="${sanitizeLinkUrl(normalizeWebsite(data.website))}" style="color: ${mutedColor}; text-decoration: none;">${esc(displayWebsite(data.website))}</a>`);
    if (data.bookingLink) contactParts.push(`<a href="${sanitizeLinkUrl(normalizeWebsite(data.bookingLink))}" style="color: ${accent}; text-decoration: none;">Book a meeting</a>`);
    if (data.address) contactParts.push(`<span style="color: ${mutedColor};">${esc(data.address)}</span>`);

    const cta = renderCtaButton(data.ctaLabel, data.ctaUrl, { bg: data.primaryColor, fg: '#FFFFFF', font: data.fontFamily });

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" style="font-family: Georgia, 'Times New Roman', ${font}, serif; text-align: center;">
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0" border="0">
        ${logoHtml}
        <tr>
          <td align="center" style="font-size: 20px; color: ${textColor}; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 2px;">${esc(data.fullName) || 'Your Name'}${data.pronouns ? ` <span style="font-size: 12px; letter-spacing: 0; color: ${mutedColor};">(${esc(data.pronouns)})</span>` : ''}</td>
        </tr>
        ${role ? `<tr><td align="center" style="font-size: 11px; color: ${accent}; font-family: ${font}, sans-serif; padding-top: 4px; text-transform: uppercase; letter-spacing: 3px;">${role}</td></tr>` : ''}
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
        ${contactParts.length ? `<tr><td align="center" style="padding-top: 10px; font-size: 12px; color: ${mutedColor}; line-height: 1.8; font-family: ${font}, sans-serif;">${contactParts.join('<br />')}</td></tr>` : ''}
        ${cta ? `<tr><td align="center" style="padding-top: 12px;">${cta}</td></tr>` : ''}
        ${socialLinks ? `<tr><td align="center" style="padding-top: 10px;"><table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>
${renderDisclaimer(data.disclaimer, data.fontFamily)}`);
  },
};
