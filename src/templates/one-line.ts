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
  renderDisclaimer,
  renderSocialLinks,
} from '../utils/templateHelpers';

/**
 * The smallest signature that is still a signature.
 *
 * Every other template answers "what should a signature show?"; this one
 * answers "what is the least it can show and still be useful?". Two lines,
 * no mark, no button — for people who reply twenty times a day in a thread
 * and do not want twenty copies of a card in it. It is also the one that
 * stays out of Gmail's clipping limit however long the conversation runs.
 *
 * The call-to-action button is deliberately left out: a button is the
 * opposite of what this template is for.
 */
export const oneLine = {
  id: 'one-line',
  name: 'One Line',
  description: 'The smallest useful signature: two lines, no images',
  features: { brandMark: false, cta: false },
  render: (data: SignatureData, options: RenderOptions = {}) => {
    const accent = esc(data.primaryColor);
    const font = fontStack(data.fontFamily);

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 14,
      cellStyle: 'padding-right: 5px;',
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    const role = roleAndCompany(data, ', ');
    const contact = contactLinks(data, { color: MUTED_TEXT, accent: data.primaryColor, style: 'font-size: 12px;' });
    const separator = `<span style="color: ${MUTED_TEXT};"> &middot; </span>`;

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" bgcolor="${LIGHT_SURFACE}" style="background-color: ${LIGHT_SURFACE}; font-family: ${font};">
  <tr>
    <td style="font-family: ${font}; font-size: 13px; color: ${accent}; line-height: 1.5;">
      <strong style="color: ${accent};">${nameWithPronouns(data, `font-weight: normal; font-size: 11px; color: ${MUTED_TEXT};`)}</strong>${role ? `<span style="color: ${MUTED_TEXT}; font-size: 12px;"> &mdash; ${role}</span>` : ''}
    </td>
  </tr>
  ${contact.length ? `<tr><td style="font-family: ${font}; font-size: 12px; color: ${MUTED_TEXT}; line-height: 1.5; padding-top: 2px;">${contact.join(separator)}</td></tr>` : ''}
  ${data.address.trim() ? `<tr><td style="font-family: ${font}; font-size: 11px; color: ${MUTED_TEXT}; padding-top: 2px;">${esc(data.address.trim())}</td></tr>` : ''}
  ${socialLinks ? `<tr><td style="padding-top: 6px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
</table>
${renderDisclaimer(data.disclaimer, { font: data.fontFamily, background: LIGHT_SURFACE })}`, data);
  },
} satisfies SignatureTemplate;
