import { useEffect, useRef, useState } from 'react';
import type { SignatureData } from '../types';
import { buildShareUrl, forShareLink, type SharedConfig } from '../utils/shareConfig';
import { parseSharedConfig } from '../utils/parseConfig';
import { downloadBlob } from '../utils/exportHelpers';
import { useToast } from '../toast';

interface Props {
  data: SignatureData;
  templateId: string;
  onLoad: (config: SharedConfig) => void;
}

/** Beyond this, chat apps and some browsers start truncating URLs. */
const LONG_LINK_CHARS = 8000;

export default function SharePanel({ data, templateId, onLoad }: Props) {
  const { addToast } = useToast();
  const [linkStatus, setLinkStatus] = useState<'idle' | 'copied'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function handleCopyLink() {
    const { config, droppedLogo } = forShareLink({ data, templateId });
    const url = buildShareUrl(config);
    try {
      await navigator.clipboard.writeText(url);
      setLinkStatus('copied');
      addToast(droppedLogo ? 'Share link copied — uploaded logos are not included in links' : 'Share link copied');
      if (url.length > LONG_LINK_CHARS) addToast('This link is very long and some chat apps may cut it off', 'info');
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setLinkStatus('idle'), 2000);
    } catch {
      setLinkStatus('idle');
      addToast('Could not copy the link', 'error');
    }
  }

  function handleExport() {
    downloadBlob(new Blob([JSON.stringify({ data, templateId }, null, 2)], { type: 'application/json' }), 'signature-config.json');
    addToast('Exported config as JSON');
  }

  async function handleImport(file: File) {
    try {
      const config = parseSharedConfig(JSON.parse(await file.text()));
      if (config) {
        onLoad(config);
        addToast('Config imported');
      } else {
        addToast('That file is not a valid signature config', 'error');
      }
    } catch {
      addToast('Could not read that file', 'error');
    }
  }

  const btn =
    'px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors';

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Save &amp; Share</h2>
      <p className="text-sm text-muted">
        Save your setup as a file or copy a link that restores it — no account needed.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleCopyLink()}
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
          aria-label="Signature config file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
