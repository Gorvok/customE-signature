import type { SignatureData, SignatureTemplate } from '../types';
import {
  esc,
  finalizeHtml,
  fontStack,
  nameWithPronouns,
  roleAndCompany,
  renderLogo,
  contactLinks,
  renderCtaButton,
  renderDisclaimer,
  renderSocialLinks,
} from '../utils/templateHelpers';

export const minimal: SignatureTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Simple, text-focused signature',
  render: (data: SignatureData, options = {}) => {
    const textColor = esc(data.primaryColor);
    const font = fontStack(data.fontFamily);

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 16,
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    const logo = renderLogo(data.logoUrl, { width: 80 });
    const role = roleAndCompany(data, ', ');
    const contact = contactLinks(data, { color: '#666666', accent: data.primaryColor });
    const cta = renderCtaButton(data.ctaLabel, data.ctaUrl, { bg: data.primaryColor, fg: '#FFFFFF', font: data.fontFamily });

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff; font-family: ${font}; font-size: 13px;">
  ${logo ? `<tr><td style="padding-bottom: 8px;">${logo}</td></tr>` : ''}
  <tr>
    <td style="font-family: ${font}; font-size: 13px;">
      <strong style="color: ${textColor}; font-size: 14px;">${nameWithPronouns(data, 'color: #888888; font-size: 12px; font-weight: normal;')}</strong>
      ${role ? `<br /><span style="color: #666666; font-size: 12px;">${role}</span>` : ''}
    </td>
  </tr>
  ${data.address.trim() ? `<tr><td style="padding-top: 4px; font-family: ${font}; font-size: 12px; color: #888888;">${esc(data.address.trim())}</td></tr>` : ''}
  ${contact.length ? `<tr><td style="padding-top: 6px; font-family: ${font}; font-size: 12px; color: #666666; line-height: 1.6;">${contact.join(' &middot; ')}</td></tr>` : ''}
  ${cta ? `<tr><td style="padding-top: 8px;">${cta}</td></tr>` : ''}
  ${socialLinks ? `<tr><td style="padding-top: 6px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
</table>
${renderDisclaimer(data.disclaimer, data.fontFamily)}`);
  },
};
