import type { SignatureData, SignatureTemplate } from '../types';
import {
  esc,
  finalizeHtml,
  roleLine,
  renderCtaButton,
  renderDisclaimer,
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
  render: (data: SignatureData, options = {}) => {
    const textColor = esc(data.primaryColor);
    const font = esc(data.fontFamily);

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 16,
      baseUrl: options.iconBaseUrl,
    });

    const role = [roleLine(data.jobTitle, data.department), data.company ? esc(data.company) : ''].filter(Boolean).join(', ');

    const contactParts: string[] = [];
    if (data.phone) contactParts.push(`<a href="${sanitizeLinkUrl(`tel:${telDigits(data.phone)}`)}" style="color: #666666; text-decoration: none;">${esc(data.phone)}</a>`);
    if (data.email) contactParts.push(`<a href="${sanitizeLinkUrl(`mailto:${data.email}`)}" style="color: #666666; text-decoration: none;">${esc(data.email)}</a>`);
    if (data.website) contactParts.push(`<a href="${sanitizeLinkUrl(normalizeWebsite(data.website))}" style="color: #666666; text-decoration: none;">${esc(displayWebsite(data.website))}</a>`);
    if (data.bookingLink) contactParts.push(`<a href="${sanitizeLinkUrl(normalizeWebsite(data.bookingLink))}" style="color: ${textColor}; text-decoration: none;">Book a meeting</a>`);

    const cta = renderCtaButton(data.ctaLabel, data.ctaUrl, { bg: data.primaryColor, fg: '#FFFFFF', font: data.fontFamily });

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${font}, sans-serif; font-size: 13px;">
  <tr>
    <td>
      <strong style="color: ${textColor}; font-size: 14px;">${esc(data.fullName) || 'Your Name'}</strong>${data.pronouns ? ` <span style="color: #888888; font-size: 12px;">(${esc(data.pronouns)})</span>` : ''}
      ${role ? `<br /><span style="color: #666666; font-size: 12px;">${role}</span>` : ''}
    </td>
  </tr>
  ${data.address ? `<tr><td style="padding-top: 4px; font-size: 12px; color: #888888;">${esc(data.address)}</td></tr>` : ''}
  ${contactParts.length ? `<tr><td style="padding-top: 6px; font-size: 12px; color: #666666; line-height: 1.6;">${contactParts.join(' &middot; ')}</td></tr>` : ''}
  ${cta ? `<tr><td style="padding-top: 8px;">${cta}</td></tr>` : ''}
  ${socialLinks ? `<tr><td style="padding-top: 6px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
</table>
${renderDisclaimer(data.disclaimer, data.fontFamily)}`);
  },
};
