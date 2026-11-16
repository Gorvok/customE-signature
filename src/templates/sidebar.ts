import type { RenderOptions, SignatureData, SignatureTemplate } from '../types';
import {
  esc,
  MUTED_TEXT,
  LIGHT_SURFACE,
  finalizeHtml,
  fontStack,
  nameWithPronouns,
  roleAndCompany,
  contactLinks,
  renderCtaButton,
  renderDisclaimer,
  renderSocialLinks,
  spacerCell,
} from '../utils/templateHelpers';
import { renderBrandMark } from '../utils/monogram';
import { withUtm } from '../utils/utm';

/**
 * A solid panel of brand color down one side, details beside it.
 *
 * The existing templates either paint the whole card (Classic Dark, Bold
 * Banner) or hint at the color with a 3px edge (Corporate, Compact Card).
 * This is the middle: enough color to be recognisable at a glance in a thread
 * without putting the text on it, which is what makes the dark templates a
 * risk in the clients that recolor content.
 *
 * With a brand mark the panel holds it; with none it narrows to a bar, since
 * an empty 96px block of color is just a mistake that looks deliberate.
 */
export const sidebar = {
  id: 'sidebar',
  name: 'Sidebar',
  description: 'A panel of brand color beside your details',
  features: { brandMark: true, cta: true },
  render: (data: SignatureData, options: RenderOptions = {}) => {
    const accentRaw = data.primaryColor;
    const accent = esc(accentRaw);
    const font = fontStack(data.fontFamily);
    const textColor = '#2d2d2d';

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 16,
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    const mark = renderBrandMark(data, { width: 64, background: data.secondaryColor || LIGHT_SURFACE, color: accentRaw });
    const role = roleAndCompany(data, ' &bull; ');
    const contact = contactLinks(data, { color: MUTED_TEXT, accent: accentRaw, style: 'font-size: 12px;' });
    const cta = renderCtaButton(data.ctaLabel, withUtm(data.ctaUrl, data), { bg: accentRaw, fg: '#FFFFFF', font: data.fontFamily });

    // The panel carries its color as both an attribute and a style: Outlook
    // reads bgcolor, and a cell with neither collapses to nothing.
    const panel = mark
      ? `<td width="96" bgcolor="${accent}" align="center" style="width: 96px; background-color: ${accent}; padding: 16px; vertical-align: middle;">${mark}</td>`
      : spacerCell({ width: 8, background: accentRaw });

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" bgcolor="${LIGHT_SURFACE}" style="background-color: ${LIGHT_SURFACE}; font-family: ${font}; border: 1px solid #e5e5e5; border-radius: 6px;">
  <tr>
    ${panel}
    <td style="padding: 16px; vertical-align: middle;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size: 16px; font-weight: bold; color: ${textColor}; font-family: ${font};">${nameWithPronouns(data, `font-size: 11px; font-weight: normal; color: ${MUTED_TEXT};`)}</td>
        </tr>
        ${role ? `<tr><td style="font-size: 12px; color: ${accent}; font-family: ${font}; padding-top: 2px;">${role}</td></tr>` : ''}
        ${data.address.trim() ? `<tr><td style="font-size: 11px; color: ${MUTED_TEXT}; font-family: ${font}; padding-top: 4px;">${esc(data.address.trim())}</td></tr>` : ''}
        ${contact.length ? `<tr><td style="font-size: 12px; font-family: ${font}; padding-top: 6px; line-height: 1.6;">${contact.join(`<span style="color: ${MUTED_TEXT};"> &middot; </span>`)}</td></tr>` : ''}
        ${cta ? `<tr><td style="padding-top: 10px;">${cta}</td></tr>` : ''}
        ${socialLinks ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>
${renderDisclaimer(data.disclaimer, { font: data.fontFamily, background: LIGHT_SURFACE })}`, data);
  },
} satisfies SignatureTemplate;
