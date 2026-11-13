/**
 * Rules for HTML that has to survive a mail client.
 *
 * Email clients are not browsers: they strip tags, drop stylesheets and
 * re-flow layout. This project already learned one of these rules the hard
 * way — social icons are hosted PNGs because Gmail and Outlook strip
 * inline/data-URI SVGs — and the rule lived only in a comment. These checks
 * put that class of knowledge where a test can enforce it.
 */

export interface EmailSafetyIssue {
  rule: string;
  message: string;
  /** The offending markup, trimmed for a readable test failure. */
  sample: string;
}

/**
 * Outlook-only blocks (`<!--[if mso]> ... <![endif]-->`) are real comments and
 * deliberately use markup no other client sees, so they are excluded. The
 * "downlevel revealed" markers `<!--[if !mso]><!-->` and `<!--<![endif]-->`
 * are themselves complete comments, so removing comments leaves the content
 * between them — which is exactly what a non-Outlook client renders.
 */
function withoutComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

const snippet = (text: string, length = 80) =>
  text.replace(/\s+/g, ' ').trim().slice(0, length);

/** CSS a desktop Outlook (and often more) will not honour. */
const UNSUPPORTED_CSS: { pattern: RegExp; property: string; why: string }[] = [
  { pattern: /display\s*:\s*(?:inline-)?flex/i, property: 'display: flex', why: 'Outlook ignores flexbox and the layout collapses' },
  { pattern: /display\s*:\s*(?:inline-)?grid/i, property: 'display: grid', why: 'Outlook ignores grid and the layout collapses' },
  { pattern: /position\s*:\s*(?:absolute|fixed|sticky)/i, property: 'position', why: 'positioned elements are dropped or misplaced' },
  // Guarded so `text-transform`, which is well supported, does not match.
  { pattern: /(?:^|[;{\s"'])transform\s*:/i, property: 'transform', why: 'transforms are not applied' },
  { pattern: /(?:^|[;{\s"'])animation\s*:/i, property: 'animation', why: 'animations do not run' },
  { pattern: /(?:^|[;{\s"'])transition\s*:/i, property: 'transition', why: 'transitions do not run' },
  { pattern: /background-image\s*:/i, property: 'background-image', why: 'Outlook needs VML for background images' },
  { pattern: /\d(?:rem|vh|vw)\b/i, property: 'rem/vh/vw units', why: 'relative units are unreliable; use px' },
];

/** Every `<img ...>` in the markup. */
const images = (html: string) => html.match(/<img\b[^>]*>/gi) ?? [];

/** Every `<table ...>` opening tag. */
const tables = (html: string) => html.match(/<table\b[^>]*>/gi) ?? [];

export function findEmailSafetyIssues(html: string): EmailSafetyIssue[] {
  const visible = withoutComments(html);
  const issues: EmailSafetyIssue[] = [];
  const add = (rule: string, message: string, sample: string) =>
    issues.push({ rule, message, sample: snippet(sample) });

  if (/<script\b/i.test(visible)) {
    add('script-tag', 'Scripts never run in email and mark the message as suspicious.', visible.match(/<script\b[^>]*>/i)?.[0] ?? '<script');
  }

  if (/<style\b/i.test(visible)) {
    add('style-block', 'Signature editors strip <style> blocks; use inline style attributes.', visible.match(/<style\b[^>]*>/i)?.[0] ?? '<style');
  }

  if (/<link\b[^>]*stylesheet/i.test(visible)) {
    add('external-stylesheet', 'External stylesheets are never loaded by a mail client.', visible.match(/<link\b[^>]*>/i)?.[0] ?? '<link');
  }

  const classAttr = /\sclass\s*=\s*["'][^"']*["']/i.exec(visible);
  if (classAttr) {
    add('class-attribute', 'Classes are useless once the stylesheet is stripped; style inline instead.', classAttr[0]);
  }

  for (const img of images(visible)) {
    if (/\bsrc\s*=\s*["']\s*data:/i.test(img)) {
      add('embedded-image', 'Gmail, Outlook and Yahoo Mail strip data: images; host the file and link to it.', img);
    }
    if (/\bsrc\s*=\s*["']\s*http:\/\//i.test(img)) {
      add('insecure-image', 'Clients block or warn on http images; serve the image over https.', img);
    }
    if (!/\bwidth\s*=/i.test(img)) {
      add('image-without-width', 'Outlook sizes images wrongly without an explicit width attribute.', img);
    }
    if (!/\balt\s*=/i.test(img)) {
      add('image-without-alt', 'Images are blocked by default in many clients, so alt text is what is read.', img);
    }
  }

  for (const table of tables(visible)) {
    if (!/role\s*=\s*["']presentation["']/i.test(table)) {
      add('layout-table-without-role', 'Layout tables need role="presentation" or screen readers announce them as data.', table);
    }
  }

  for (const { pattern, property, why } of UNSUPPORTED_CSS) {
    const match = pattern.exec(visible);
    if (match) {
      add('unsupported-css', `${property} is unsupported: ${why}.`, match[0]);
    }
  }

  return issues;
}

/** One readable line per issue, for a test failure message. */
export function formatIssues(issues: EmailSafetyIssue[]): string {
  return issues.map((i) => `  [${i.rule}] ${i.message}\n    at: ${i.sample}`).join('\n');
}
