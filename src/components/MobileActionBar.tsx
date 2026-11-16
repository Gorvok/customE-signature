import { useEffect, useRef, useState } from 'react';
import { copyHtmlToClipboard, downloadHtmlFile } from '../utils/exportHelpers';
import { useToast } from '../toast';

interface Props {
  /** The signature as it will be exported (production icon URLs). */
  html: string;
  /** Switches the mobile view, so the result of a copy can be looked at. */
  onShowPreview: () => void;
}

/**
 * The export actions, within reach on a phone.
 *
 * On a narrow screen the form is a long scroll and the export panel sits at
 * the bottom of the *other* tab, so copying your finished signature meant
 * scrolling to the end of the page and switching views. The desktop layout
 * has no such problem — the panel is in the sticky second column — so this
 * bar exists only below `lg`.
 */
export default function MobileActionBar({ html, onShowPreview }: Props) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleCopy() {
    const result = await copyHtmlToClipboard(html);
    if (result === 'failed') {
      addToast('Copy failed — try Download', 'error');
      return;
    }
    setCopied(true);
    addToast(
      result === 'rich'
        ? 'Signature copied — paste it into your email settings'
        : 'Copied as HTML code — if it pastes as code, use Download instead',
      result === 'rich' ? 'success' : 'info',
    );
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
            copied ? 'bg-green-600' : 'bg-accent hover:bg-accent-hover'
          }`}
        >
          {copied ? 'Copied!' : 'Copy signature'}
        </button>
        <button
          type="button"
          onClick={() => {
            downloadHtmlFile(html);
            addToast('Downloaded signature HTML');
          }}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
        >
          Download
        </button>
        <button
          type="button"
          onClick={onShowPreview}
          className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Preview
        </button>
      </div>
    </div>
  );
}
