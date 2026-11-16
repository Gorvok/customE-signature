import { useEffect, useMemo, useRef, useState } from 'react';
import type { SignatureData, SignatureTemplate } from '../types';
import { providers } from '../data/providers';
import { copyHtmlToClipboard, downloadBlob, downloadHtmlFile, type CopyResult } from '../utils/exportHelpers';
import { buildVCard, vcardFilename } from '../utils/vcard';
import { buildEml, emlFilename } from '../utils/eml';
import { qrPngBlob } from '../utils/qrCode';
import {
  compatibilityWarnings,
  formatBytes,
  signatureBytes,
  type CompatibilityWarning,
} from '../utils/compatibility';
import { useToast, type ToastType } from '../toast';

interface Props {
  data: SignatureData;
  template: SignatureTemplate;
}

type CopyStatus = 'idle' | 'success' | 'error';

/** What each clipboard outcome means for the person pasting. */
const COPY_FEEDBACK: Record<CopyResult, { message: string; type: ToastType; status: CopyStatus }> = {
  rich: { message: 'Signature copied — paste it into your email settings', type: 'success', status: 'success' },
  text: {
    message: 'Copied as HTML code — if it pastes as code, use Download HTML instead',
    type: 'info',
    status: 'success',
  },
  failed: { message: 'Copy failed — try Download HTML', type: 'error', status: 'error' },
};

function ExportActions({
  showCopy,
  showDownload,
  copyStatus,
  onCopy,
  onDownload,
}: {
  showCopy: boolean;
  showDownload: boolean;
  copyStatus: CopyStatus;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const copyClass =
    copyStatus === 'success'
      ? 'bg-green-600 text-white'
      : copyStatus === 'error'
        ? 'bg-red-600 text-white'
        : 'bg-blue-600 hover:bg-blue-500 text-white';
  const copyLabel = copyStatus === 'success' ? 'Copied!' : copyStatus === 'error' ? 'Failed — try download' : 'Copy to Clipboard';

  return (
    <div className="flex flex-wrap gap-3">
      {showCopy && (
        <button type="button" onClick={onCopy} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${copyClass}`}>
          {copyLabel}
        </button>
      )}
      {showDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
        >
          Download HTML
        </button>
      )}
    </div>
  );
}

/**
 * What the preview cannot show: the preview is a browser, and the person's
 * mail client is not. Sizes and stripped images only matter once it leaves.
 */
function CompatibilityNotes({ html, warnings }: { html: string; warnings: CompatibilityWarning[] }) {
  return (
    <div role="status" className="space-y-2">
      <p className="text-xs text-hint">
        Signature size: {formatBytes(signatureBytes(html))} · {html.length.toLocaleString()} characters
      </p>
      {warnings.map((warning) => (
        <p
          key={warning.id}
          className={`rounded-lg border px-3 py-2 text-xs ${
            warning.level === 'warning'
              ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300'
              : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
          }`}
        >
          {warning.message}
        </p>
      ))}
    </div>
  );
}

/**
 * The contact card. Both outputs are files rather than markup, so nothing a
 * mail client strips applies to them — but a QR only helps inside a signature
 * once it is hosted, which the copy says plainly.
 */
function ContactCard({ data }: { data: SignatureData }) {
  const { addToast } = useToast();

  function handleVCard() {
    downloadBlob(new Blob([buildVCard(data)], { type: 'text/vcard;charset=utf-8' }), vcardFilename(data));
    addToast('Downloaded contact card — attach it to an email or import it');
  }

  async function handleQr() {
    try {
      const blob = await qrPngBlob(buildVCard(data));
      downloadBlob(blob, vcardFilename(data).replace(/\.vcf$/, '-qr.png'));
      addToast('Downloaded QR code — host it, then paste the link as your logo');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not create the QR code.', 'error');
    }
  }

  return (
    <div className="space-y-2 border-t border-gray-200 dark:border-gray-800 pt-4">
      <h3 className="font-medium text-gray-900 dark:text-white">Contact card</h3>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleVCard}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
        >
          Download .vcf
        </button>
        <button
          type="button"
          onClick={() => void handleQr()}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
        >
          Download QR code
        </button>
      </div>
      <p className="text-xs text-hint">
        The QR holds these contact details, so scanning it adds the contact without a network. It is
        generated here — nothing is sent to a QR service. To show it inside a signature, host the PNG
        and paste the link, the same as a logo.
      </p>
    </div>
  );
}

export default function ExportPanel({ data, template }: Props) {
  const { addToast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const html = useMemo(() => template.render(data), [data, template]);
  const provider = providers.find((p) => p.id === selectedProvider);
  const warnings = useMemo(() => compatibilityWarnings({ html, data, provider }), [html, data, provider]);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function handleCopy() {
    const feedback = COPY_FEEDBACK[await copyHtmlToClipboard(html)];
    setCopyStatus(feedback.status);
    addToast(feedback.message, feedback.type);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyStatus('idle'), 2000);
  }

  function handleDownload() {
    downloadHtmlFile(html, `signature-${template.id}.html`);
    addToast('Downloaded signature HTML');
  }

  function handleEml() {
    downloadBlob(new Blob([buildEml(data, html)], { type: 'message/rfc822' }), emlFilename(data));
    addToast('Downloaded — open it to see the signature as a received message');
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Export</h2>

      {/* Provider grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedProvider(p.id)}
            aria-pressed={selectedProvider === p.id}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              selectedProvider === p.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-900'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {provider ? (
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">Setup Instructions for {provider.name}</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
            {provider.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <CompatibilityNotes html={html} warnings={warnings} />
          <ExportActions
            showCopy={provider.exportMethod === 'clipboard' || provider.exportMethod === 'both'}
            showDownload={provider.exportMethod === 'download' || provider.exportMethod === 'both'}
            copyStatus={copyStatus}
            onCopy={() => void handleCopy()}
            onDownload={handleDownload}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <CompatibilityNotes html={html} warnings={warnings} />
          <ExportActions showCopy showDownload copyStatus={copyStatus} onCopy={() => void handleCopy()} onDownload={handleDownload} />
        </div>
      )}

      {/* The nearest thing to a test send that a page without a server can
          offer: the file opens as a received message in the real client. */}
      <div className="space-y-2 border-t border-gray-200 dark:border-gray-800 pt-4">
        <h3 className="font-medium text-gray-900 dark:text-white">See it as a received message</h3>
        <button
          type="button"
          onClick={handleEml}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
        >
          Download .eml
        </button>
        <p className="text-xs text-hint">
          Open the file and your mail client renders the signature with its own engine, the way a
          recipient will see it — which the preview above, being a browser, cannot do. Nothing is
          sent: the message is written here and never leaves your computer.
        </p>
      </div>

      <ContactCard data={data} />
    </div>
  );
}
