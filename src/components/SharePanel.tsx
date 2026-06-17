import { useRef, useState } from 'react';
import type { SignatureData } from '../types';
import { buildShareUrl, type SharedConfig } from '../utils/shareConfig';

interface Props {
  data: SignatureData;
  templateId: string;
  onLoad: (config: SharedConfig) => void;
}

export default function SharePanel({ data, templateId, onLoad }: Props) {
  const [linkStatus, setLinkStatus] = useState<'idle' | 'copied'>('idle');
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(buildShareUrl({ data, templateId }));
      setLinkStatus('copied');
      setTimeout(() => setLinkStatus('idle'), 2000);
    } catch {
      setLinkStatus('idle');
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify({ data, templateId }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signature-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    setImportError('');
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object') {
        onLoad(parsed as SharedConfig);
      } else {
        setImportError('That file is not a valid signature config.');
      }
    } catch {
      setImportError('Could not read that file.');
    }
  }

  const btn =
    'px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors';

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Save &amp; Share</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Save your setup as a file or copy a link that restores it — no account needed.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopyLink}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            linkStatus === 'copied' ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {linkStatus === 'copied' ? 'Link copied!' : 'Copy share link'}
        </button>
        <button type="button" onClick={handleExport} className={btn}>
          Export JSON
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className={btn}>
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
            e.target.value = '';
          }}
        />
      </div>
      {importError && <p className="text-sm text-red-500">{importError}</p>}
    </div>
  );
}
