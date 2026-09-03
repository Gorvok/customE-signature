import type { RenderOptions, SignatureData, SignatureTemplate } from '../types';
import {
  esc,
  finalizeHtml,
  fontStack,
  roleLine,
  nameWithPronouns,
  renderLogo,
  contactLinks,
  spacerCell,
  renderCtaButton,
  renderDisclaimer,
  renderSocialLinks,
} from '../utils/templateHelpers';

export const corporate = {
  id: 'corporate',
  name: 'Corporate',
  description: 'Professional enterprise style with left accent',
  render: (data: SignatureData, options: RenderOptions = {}) => {
    const accent = esc(data.primaryColor);
    const font = fontStack(data.fontFamily);
    const textDark = '#2d2d2d';
    const textMuted = '#777777';

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 16,
      cellStyle: 'padding-right: 8px;',
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    const logo = renderLogo(data.logoUrl, { width: 90 });
    const role = roleLine(data.jobTitle, data.department);

    const muted = (inner: string) =>
      `<tr><td style="padding: 1px 0; font-size: 12px; color: ${textMuted}; font-family: ${font};">${inner}</td></tr>`;
    const contactRows = contactLinks(data, {
      color: textMuted,
      accent: data.primaryColor,
      websiteColor: data.primaryColor,
      phoneLabel: 'Tel: ',
      bookingStyle: 'font-weight: 600;',
    }).map(muted);
    if (data.address.trim()) contactRows.push(muted(esc(data.address.trim())));

    const cta = renderCtaButton(data.ctaLabel, data.ctaUrl, { bg: data.primaryColor, fg: '#FFFFFF', font: data.fontFamily });

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff; font-family: ${font};">
  <tr>
    ${spacerCell({ width: 4, background: data.primaryColor, style: 'border-radius: 2px;' })}
    <td style="padding-left: 16px; vertical-align: top;">
      <table cellpadding="0" cellspacing="0" border="0">
        ${logo ? `<tr><td style="padding-bottom: 10px;">${logo}</td></tr>` : ''}
        <tr>
          <td style="font-size: 18px; font-weight: bold; color: ${textDark}; font-family: ${font}; text-transform: uppercase; letter-spacing: 1px;">${nameWithPronouns(data, `font-size: 12px; font-weight: normal; text-transform: none; letter-spacing: 0; color: ${textMuted};`)}</td>
        </tr>
        ${role ? `<tr><td style="font-size: 12px; color: ${accent}; font-family: ${font}; padding-top: 2px; font-weight: 600;">${role}</td></tr>` : ''}
        ${data.company.trim() ? `<tr><td style="font-size: 12px; color: ${textMuted}; font-family: ${font}; padding-top: 1px;">${esc(data.company.trim())}</td></tr>` : ''}
        ${contactRows.length ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0">${contactRows.join('')}</table></td></tr>` : ''}
        ${cta ? `<tr><td style="padding-top: 10px;">${cta}</td></tr>` : ''}
        ${socialLinks ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>
${renderDisclaimer(data.disclaimer, data.fontFamily)}`);
  },
} satisfies SignatureTemplate;
