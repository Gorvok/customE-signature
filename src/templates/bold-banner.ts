import type { RenderOptions, SignatureData, SignatureTemplate } from '../types';
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

export const boldBanner = {
  id: 'bold-banner',
  name: 'Bold Banner',
  description: 'Eye-catching colored banner with large name',
  render: (data: SignatureData, options: RenderOptions = {}) => {
    const fgRaw = data.secondaryColor || '#FFFFFF';
    const bg = esc(data.primaryColor);
    const fg = esc(fgRaw);
    const font = fontStack(data.fontFamily);

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 16,
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    const logo = renderLogo(data.logoUrl, { width: 50, style: 'border-radius: 50%;' });
    const logoCell = logo ? `<td style="padding-right: 14px; vertical-align: middle;">${logo}</td>` : '';

    const role = roleLine(data.jobTitle, data.department);
    const company = data.company.trim() ? esc(data.company.trim()) : '';
    const subtitle = role && company ? `${role} at ${company}` : role || company;

    const contact = contactLinks(data, {
      color: '#555555',
      accent: data.primaryColor,
      style: 'font-size: 12px;',
      bookingStyle: 'font-weight: bold;',
    });

    const cta = renderCtaButton(data.ctaLabel, data.ctaUrl, { bg: data.primaryColor, fg: fgRaw, font: data.fontFamily });

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${font}; border-collapse: collapse;">
  <tr>
    <td bgcolor="${bg}" style="background-color: ${bg}; padding: 16px 20px; border-radius: 6px 6px 0 0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${logoCell}
          <td style="vertical-align: middle; font-family: ${font};">
            <span style="font-size: 22px; font-weight: bold; color: ${fg}; font-family: ${font}; letter-spacing: 0.5px;">${nameWithPronouns(data, 'font-size: 13px; font-weight: normal; letter-spacing: 0; opacity: 0.85;')}</span>
            ${subtitle ? `<br /><span style="font-size: 13px; color: ${fg}; opacity: 0.85; font-family: ${font};">${subtitle}</span>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td bgcolor="#f8f8f8" style="background-color: #f8f8f8; padding: 12px 20px; border-radius: 0 0 6px 6px; border: 1px solid #e8e8e8; border-top: none;">
      <table cellpadding="0" cellspacing="0" border="0">
        ${data.address.trim() ? `<tr><td style="font-size: 12px; color: #777777; font-family: ${font}; padding-bottom: 4px;">${esc(data.address.trim())}</td></tr>` : ''}
        ${contact.length ? `<tr><td style="font-size: 12px; line-height: 1.8; font-family: ${font};">${contact.join(' &nbsp;&middot;&nbsp; ')}</td></tr>` : ''}
        ${cta ? `<tr><td style="padding-top: 8px;">${cta}</td></tr>` : ''}
        ${socialLinks ? `<tr><td style="padding-top: 6px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>
${renderDisclaimer(data.disclaimer, data.fontFamily)}`);
  },
} satisfies SignatureTemplate;
