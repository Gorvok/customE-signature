import type { RenderOptions, SignatureData, SignatureTemplate } from '../types';
import {
  esc,
  MUTED_TEXT,
  LIGHT_SURFACE,
  finalizeHtml,
  nameWithPronouns,
  roleAndCompany,
  renderCtaButton,
  renderDisclaimer,
  renderSocialLinks,
  spacerCell,
  sanitizeLinkUrl,
  normalizeWebsite,
  displayWebsite,
  telDigits,
} from '../utils/templateHelpers';
import { withUtm } from '../utils/utm';

/**
 * A monospace signature, laid out like a terminal.
 *
 * Every other template is set in a proportional face and arranges itself in
 * columns. This one sets everything in the monospace stack and labels each
 * line, which is how a lot of people who write code already sign off. The
 * font choice is the template's, not the person's: the look is the point of
 * it, the same way Elegant forces a serif for the name.
 */
const MONO = 'Courier New, Courier, monospace';

export const mono = {
  id: 'mono',
  name: 'Mono',
  description: 'Monospace, labelled lines, terminal-flavoured',
  features: { brandMark: false, cta: true },
  render: (data: SignatureData, options: RenderOptions = {}) => {
    const accent = esc(data.primaryColor);
    const textColor = '#2d2d2d';

    const socialLinks = renderSocialLinks(data.socials, {
      style: data.iconStyle,
      size: 14,
      cellStyle: 'padding-right: 6px;',
      baseUrl: options.iconBaseUrl,
      order: data.socialOrder,
    });

    const role = roleAndCompany(data, ' @ ');
    const cta = renderCtaButton(data.ctaLabel, withUtm(data.ctaUrl, data), { bg: data.primaryColor, fg: '#FFFFFF', font: data.fontFamily });

    /** `label: value`, with the label in the muted color and fixed width. */
    const line = (label: string, value: string) =>
      `<tr><td style="font-family: ${MONO}; font-size: 12px; color: ${MUTED_TEXT}; padding-top: 2px; line-height: 1.6;">${label}&nbsp;${value}</td></tr>`;

    const link = (href: string, text: string) =>
      `<a href="${href}" style="color: ${accent}; text-decoration: none; font-family: ${MONO};">${text}</a>`;

    const rows: string[] = [];
    const email = data.email.trim();
    if (email) rows.push(line('mail:', link(sanitizeLinkUrl(`mailto:${email}`), esc(email))));
    const phone = data.phone.trim();
    if (phone) {
      const digits = telDigits(phone);
      rows.push(line('tel: ', digits ? link(sanitizeLinkUrl(`tel:${digits}`), esc(phone)) : esc(phone)));
    }
    const website = data.website.trim();
    if (website) {
      rows.push(line('web: ', link(sanitizeLinkUrl(withUtm(normalizeWebsite(website), data)), esc(displayWebsite(website)))));
    }
    const booking = data.bookingLink.trim();
    if (booking) {
      rows.push(line('meet:', link(sanitizeLinkUrl(withUtm(normalizeWebsite(booking), data)), 'book a time')));
    }
    if (data.address.trim()) rows.push(line('addr:', esc(data.address.trim())));

    // A rule drawn as a cell rather than typed as dashes: a row of hyphens
    // wraps at a narrow width and breaks the alignment it exists to keep.
    const rule = `<table cellpadding="0" cellspacing="0" border="0" width="220"><tr>${spacerCell({ width: 220, height: 1, background: '#d4d4d4' })}</tr></table>`;

    return finalizeHtml(`<table cellpadding="0" cellspacing="0" border="0" bgcolor="${LIGHT_SURFACE}" style="background-color: ${LIGHT_SURFACE}; font-family: ${MONO};">
  <tr>
    <td style="font-family: ${MONO}; font-size: 14px; font-weight: bold; color: ${textColor};">${nameWithPronouns(data, `font-size: 11px; font-weight: normal; color: ${MUTED_TEXT};`)}</td>
  </tr>
  ${role ? `<tr><td style="font-family: ${MONO}; font-size: 12px; color: ${accent}; padding-top: 2px;">${role}</td></tr>` : ''}
  <tr><td style="padding-top: 6px; padding-bottom: 6px;">${rule}</td></tr>
  ${rows.join('')}
  ${cta ? `<tr><td style="padding-top: 10px;">${cta}</td></tr>` : ''}
  ${socialLinks ? `<tr><td style="padding-top: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>${socialLinks}</tr></table></td></tr>` : ''}
</table>
${renderDisclaimer(data.disclaimer, { font: data.fontFamily, background: LIGHT_SURFACE })}`, data);
  },
} satisfies SignatureTemplate;
