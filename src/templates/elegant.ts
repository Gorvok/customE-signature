import type { RenderOptions, SignatureData, SignatureTemplate } from '../types';
import {
  esc,
  finalizeHtml,
  fontStack,
  nameWithPronouns,
  roleAndCompany,
  renderLogo,
  contactLinks,
  spacerCell,
  renderCtaButton,
  renderDisclaimer,
  renderSocialLinks,
} from '../utils/templateHelpers';

/** The name is always set in a serif regardless of the chosen body font. */
const SERIF = 'Georgia, Times New Roman, Times, serif';

export const elegant = {
  id: 'elegant',
  name: 'Elegant',
  description: 'Refined style with centered layout and dividers',
  render: (data: SignatureData, options: RenderOptions = {}) => {
    const accent = esc(data.primaryColor);
    const font = fontStack(data.fontFamily);
    const textColor = '#3a3a3a';
    const mutedColor = '#999999';

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 16,
      cellStyle: 'padding: 0 5px;',
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    const logo = renderLogo(data.logoUrl, { width: 60 });
    const role = roleAndCompany(data, '  &mdash;  ');

    const contact = contactLinks(data, { color: mutedColor, accent: data.primaryColor });
    if (data.address.trim()) contact.push(`<span style="color: ${mutedColor};">${esc(data.address.trim())}</span>`);

    const cta = renderCtaButton(data.ctaLabel, data.ctaUrl, { bg: data.primaryColor, fg: '#FFFFFF', font: data.fontFamily });

    // A 1px line, a dot, and another line. The lines sit in nested tables so
    // they stay 1px tall next to the 6px dot (a cell's background fills the
    // whole row height).
    const line = `<td width="40" style="width: 40px; vertical-align: middle;"><table cellpadding="0" cellspacing="0" border="0" width="40"><tr>${spacerCell({ width: 40, height: 1, background: data.primaryColor })}</tr></table></td>`;
    const gap = spacerCell({ width: 8 });
    const dot = spacerCell({ width: 6, height: 6, background: data.primaryColor, style: 'border-radius: 50%;' });
    const divider = `<table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>${line}${gap}${dot}${gap}${line}</tr></table>`;

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff; font-family: ${font}; text-align: center;">
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0" border="0">
        ${logo ? `<tr><td align="center" style="padding-bottom: 10px;">${logo}</td></tr>` : ''}
        <tr>
          <td align="center" style="font-size: 20px; color: ${textColor}; font-family: ${SERIF}; letter-spacing: 2px;">${nameWithPronouns(data, `font-size: 12px; letter-spacing: 0; color: ${mutedColor};`)}</td>
        </tr>
        ${role ? `<tr><td align="center" style="font-size: 11px; color: ${accent}; font-family: ${font}; padding-top: 4px; text-transform: uppercase; letter-spacing: 3px;">${role}</td></tr>` : ''}
        <tr>
          <td align="center" style="padding-top: 10px;">${divider}</td>
        </tr>
        ${contact.length ? `<tr><td align="center" style="padding-top: 10px; font-size: 12px; color: ${mutedColor}; line-height: 1.8; font-family: ${font};">${contact.join('<br />')}</td></tr>` : ''}
        ${cta ? `<tr><td align="center" style="padding-top: 12px;">${cta}</td></tr>` : ''}
        ${socialLinks ? `<tr><td align="center" style="padding-top: 10px;"><table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>
${renderDisclaimer(data.disclaimer, data.fontFamily)}`);
  },
} satisfies SignatureTemplate;
