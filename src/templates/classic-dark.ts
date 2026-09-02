import type { SignatureData, SignatureTemplate } from '../types';
import {
  esc,
  finalizeHtml,
  fontStack,
  roleLine,
  nameWithPronouns,
  renderLogo,
  contactLinks,
  renderCtaButton,
  renderDisclaimer,
  renderSocialLinks,
} from '../utils/templateHelpers';

export const classicDark: SignatureTemplate = {
  id: 'classic-dark',
  name: 'Classic Dark',
  description: 'Professional dark theme with two-column layout',
  render: (data: SignatureData, options = {}) => {
    const secondaryRaw = data.secondaryColor || '#FFFFFF';
    const primary = esc(data.primaryColor);
    const secondary = esc(secondaryRaw);
    const font = fontStack(data.fontFamily);

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 18,
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    const logo = renderLogo(data.logoUrl, { width: 100 });
    const role = roleLine(data.jobTitle, data.department);

    const rows = contactLinks(data, { color: secondaryRaw, style: 'font-size: 12px;' }).map(
      (link) => `<tr><td style="padding: 2px 0; font-family: ${font};">${link}</td></tr>`,
    );
    if (data.address.trim()) {
      rows.push(`<tr><td style="padding: 2px 0; color: ${secondary}; font-size: 12px; font-family: ${font};">${esc(data.address.trim())}</td></tr>`);
    }

    const cta = renderCtaButton(data.ctaLabel, data.ctaUrl, {
      bg: secondaryRaw,
      fg: data.primaryColor,
      font: data.fontFamily,
    });

    // The disclaimer lives inside the dark box: in the secondary (light)
    // color it would be invisible on the email's own white background.
    const disclaimer = renderDisclaimer(data.disclaimer, data.fontFamily, secondaryRaw);

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" bgcolor="${primary}" style="background-color: ${primary}; border: 1px solid ${secondary}; border-radius: 5px; font-family: ${font};">
  <tr>
    <td style="padding: 25px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align: top; padding-right: 15px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-weight: bold; font-size: 20px; color: ${secondary}; font-family: ${font};">${nameWithPronouns(data, 'font-size: 12px; font-weight: normal; opacity: 0.8;')}</td>
              </tr>
              ${role ? `<tr><td style="font-size: 12px; color: ${secondary}; font-family: ${font}; padding-top: 2px;">${role}</td></tr>` : ''}
              ${logo ? `<tr><td style="padding-top: 10px;">${logo}</td></tr>` : ''}
            </table>
          </td>
          <td style="border-left: 1px solid ${secondary}; padding-left: 15px; vertical-align: top;">
            <table cellpadding="0" cellspacing="0" border="0">
              ${data.company.trim() ? `<tr><td style="font-weight: bold; font-size: 12px; color: ${secondary}; font-family: ${font}; padding-bottom: 4px;">${esc(data.company.trim())}</td></tr>` : ''}
              ${rows.join('')}
              ${cta ? `<tr><td style="padding-top: 10px;">${cta}</td></tr>` : ''}
              ${socialLinks ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
      ${disclaimer}
    </td>
  </tr>
</table>`);
  },
};
