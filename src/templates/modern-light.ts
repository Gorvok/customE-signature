import type { RenderOptions, SignatureData, SignatureTemplate } from '../types';
import {
  esc,
  MUTED_TEXT,
  LIGHT_SURFACE,
  finalizeHtml,
  fontStack,
  nameWithPronouns,
  roleAndCompany,
  renderLogo,
  logoAlt,
  contactLinks,
  renderCtaButton,
  renderDisclaimer,
  renderSocialLinks,
} from '../utils/templateHelpers';
import { withUtm } from '../utils/utm';

export const modernLight = {
  id: 'modern-light',
  name: 'Modern Light',
  description: 'Clean light theme with accent color bar',
  render: (data: SignatureData, options: RenderOptions = {}) => {
    const accentColor = esc(data.primaryColor);
    const font = fontStack(data.fontFamily);
    const textColor = '#333333';

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 18,
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    const logo = renderLogo(data.logoUrl, { width: 70, alt: logoAlt(data), style: 'border-radius: 4px;' });
    const logoCell = logo ? `<td style="padding-right: 15px; vertical-align: middle;">${logo}</td>` : '';

    const role = roleAndCompany(data, ' | ');
    const contact = contactLinks(data, {
      color: textColor,
      accent: data.primaryColor,
      style: 'font-size: 12px;',
      bookingStyle: 'font-weight: bold;',
    });

    const cta = renderCtaButton(data.ctaLabel, withUtm(data.ctaUrl, data), { bg: data.primaryColor, fg: '#FFFFFF', font: data.fontFamily });

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff; font-family: ${font}; border-top: 3px solid ${accentColor};">
  <tr>
    <td style="padding-top: 12px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${logoCell}
          <td style="vertical-align: top;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size: 18px; font-weight: bold; color: ${textColor}; font-family: ${font};">${nameWithPronouns(data, `font-size: 12px; font-weight: normal; color: ${MUTED_TEXT};`)}</td>
              </tr>
              ${role ? `<tr><td style="font-size: 12px; color: ${accentColor}; font-family: ${font}; padding-top: 2px;">${role}</td></tr>` : ''}
              ${data.address.trim() ? `<tr><td style="font-size: 12px; color: ${MUTED_TEXT}; font-family: ${font}; padding-top: 2px;">${esc(data.address.trim())}</td></tr>` : ''}
              ${contact.length ? `<tr><td style="padding-top: 6px; font-family: ${font};">${contact.join(' &nbsp;|&nbsp; ')}</td></tr>` : ''}
              ${cta ? `<tr><td style="padding-top: 10px;">${cta}</td></tr>` : ''}
              ${socialLinks ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
${renderDisclaimer(data.disclaimer, { font: data.fontFamily, background: LIGHT_SURFACE })}`);
  },
} satisfies SignatureTemplate;
