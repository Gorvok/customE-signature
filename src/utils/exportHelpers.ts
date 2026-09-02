export type CopyResult = 'rich' | 'text' | 'failed';

/**
 * Copy the signature to the clipboard. 'rich' means the HTML went on as
 * text/html (with a plain-text alternate) and will paste as a formatted
 * signature; 'text' means only the raw HTML source could be written, which
 * pastes as code in most editors; 'failed' means neither worked.
 */
export async function copyHtmlToClipboard(html: string): Promise<CopyResult> {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([htmlToPlainText(html)], { type: 'text/plain' }),
      }),
    ]);
    return 'rich';
  } catch {
    // Rich clipboard writes are unsupported or denied; fall through.
  }
  try {
    await navigator.clipboard.writeText(html);
    return 'text';
  } catch {
    return 'failed';
  }
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  middot: '·', bull: '•', mdash: '—', ndash: '–', copy: '©', reg: '®',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n = code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

const stripScheme = (url: string) => url.replace(/^https?:\/\//i, '').replace(/\/$/, '');

/**
 * A readable plain-text rendering of a generated signature, for the
 * text/plain clipboard slot and text-only mail clients. Links become
 * "label (url)" unless the label already is the address; social icons become
 * their platform name; logos and Outlook-only markup are dropped.
 */
export function htmlToPlainText(html: string): string {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<img\b[^>]*\balt="([^"]*)"[^>]*>/gi, (_, alt: string) => (alt && alt !== 'Logo' ? alt : ''))
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, inner: string) => {
      const label = decodeEntities(inner.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
      const url = decodeEntities(href).trim();
      if (!url || url === '#' || /^(mailto|tel):/i.test(url)) return label;
      if (!label) return url;
      if (stripScheme(label) === stripScheme(url)) return url;
      return `${label} (${url})`;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(tr|div|p|table|center|h[1-6])>/gi, '\n')
    .replace(/<\/td>/gi, '  ')
    .replace(/<[^>]+>/g, '');

  return decodeEntities(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** Trigger a browser download of `blob` under `filename`. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Download the signature as a complete HTML document (what Thunderbird and Outlook's file import expect). */
export function downloadHtmlFile(html: string, filename = 'email-signature.html'): void {
  const fullHtml = `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"></head><body>\n${html}\n</body></html>`;
  downloadBlob(new Blob([fullHtml], { type: 'text/html' }), filename);
}
