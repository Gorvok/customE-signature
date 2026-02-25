export async function copyHtmlToClipboard(html: string): Promise<boolean> {
  try {
    const blob = new Blob([html], { type: 'text/html' });
    const plainBlob = new Blob([html], { type: 'text/plain' });
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blob,
        'text/plain': plainBlob,
      }),
    ]);
    return true;
  } catch {
    // Fallback: copy as plain text
    try {
      await navigator.clipboard.writeText(html);
      return true;
    } catch {
      return false;
    }
  }
}

export function downloadHtmlFile(html: string, filename = 'email-signature.html') {
  const fullHtml = `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"></head><body>\n${html}\n</body></html>`;
  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
