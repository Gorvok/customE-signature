import { useState, useMemo } from 'react';
import type { SignatureData, SignatureTemplate } from '../types';
import { providers } from '../data/providers';
import { copyHtmlToClipboard, downloadHtmlFile } from '../utils/exportHelpers';
import { useToast } from '../toast';

interface Props {
  data: SignatureData;
  template: SignatureTemplate;
}

export default function ExportPanel({ data, template }: Props) {
  const { addToast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const html = useMemo(() => template.render(data), [data, template]);
  const provider = providers.find((p) => p.id === selectedProvider);

  async function handleCopy() {
    const ok = await copyHtmlToClipboard(html);
    setCopyStatus(ok ? 'success' : 'error');
    addToast(ok ? 'Signature copied — paste it into your email settings' : 'Copy failed — try Download HTML', ok ? 'success' : 'error');
    setTimeout(() => setCopyStatus('idle'), 2000);
  }

  function handleDownload() {
    downloadHtmlFile(html, `signature-${template.id}.html`);
    addToast('Downloaded signature HTML');
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Export</h3>

      {/* Provider grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedProvider(p.id)}
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

      {/* Provider instructions + actions */}
      {provider && (
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Setup Instructions for {provider.name}</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
            {provider.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-3">
            {(provider.exportMethod === 'clipboard' || provider.exportMethod === 'both') && (
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copyStatus === 'success'
                    ? 'bg-green-600 text-white'
                    : copyStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {copyStatus === 'success' ? 'Copied!' : copyStatus === 'error' ? 'Failed — try download' : 'Copy to Clipboard'}
              </button>
            )}
            {(provider.exportMethod === 'download' || provider.exportMethod === 'both') && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
              >
                Download HTML
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fallback: always show both options */}
      {!provider && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              copyStatus === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {copyStatus === 'success' ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
          >
            Download HTML
          </button>
        </div>
      )}
    </div>
  );
}
