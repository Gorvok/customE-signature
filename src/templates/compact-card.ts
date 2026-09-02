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

export const compactCard: SignatureTemplate = {
  id: 'compact-card',
  name: 'Compact Card',
  description: 'Space-efficient card with rounded photo area',
  render: (data: SignatureData, options = {}) => {
    const accent = esc(data.primaryColor);
    const font = fontStack(data.fontFamily);
    const textDark = '#333333';
    const textLight = '#888888';

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 14,
      cellStyle: 'padding-right: 5px;',
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    // Width only, so a non-square logo keeps its aspect ratio; clients that
    // support border-radius round it, the rest show it square.
    const logo = renderLogo(data.logoUrl, { width: 52, style: `border-radius: 50%; border: 2px solid ${accent};` });
    const logoCell = logo ? `<td style="vertical-align: middle; padding-right: 12px;">${logo}</td>` : '';

    const role = roleAndCompany(data, ' &bull; ');
    const contact = contactLinks(data, {
      color: textLight,
      accent: data.primaryColor,
      websiteColor: data.primaryColor,
      websiteStyle: 'font-weight: 500;',
      bookingStyle: 'font-weight: 500;',
    });

    const cta = renderCtaButton(data.ctaLabel, data.ctaUrl, { bg: data.primaryColor, fg: '#FFFFFF', font: data.fontFamily });

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff; font-family: ${font}; border: 1px solid #e5e5e5; border-radius: 8px; border-left: 3px solid ${accent};">
  <tr>
    <td style="padding: 14px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${logoCell}
          <td style="vertical-align: middle;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size: 15px; font-weight: bold; color: ${textDark}; font-family: ${font}; line-height: 1.2;">${nameWithPronouns(data, `font-size: 11px; font-weight: normal; color: ${textLight};`)}</td>
              </tr>
              ${role ? `<tr><td style="font-size: 11px; color: ${textLight}; font-family: ${font}; padding-top: 1px;">${role}</td></tr>` : ''}
              ${data.address.trim() ? `<tr><td style="font-size: 11px; color: ${textLight}; font-family: ${font}; padding-top: 1px;">${esc(data.address.trim())}</td></tr>` : ''}
              ${contact.length ? `<tr><td style="font-size: 11px; font-family: ${font}; padding-top: 4px;">${contact.join(' &nbsp;| ')}</td></tr>` : ''}
              ${cta ? `<tr><td style="padding-top: 8px;">${cta}</td></tr>` : ''}
              ${socialLinks ? `<tr><td style="padding-top: 5px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
${renderDisclaimer(data.disclaimer, data.fontFamily)}`);
  },
};
