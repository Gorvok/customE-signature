import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { SignatureData, SignatureTemplate } from '../types';
import { LOCAL_ICON_BASE } from '../utils/templateHelpers';
import { useToast } from '../toast';

interface Props {
  data: SignatureData;
  template: SignatureTemplate;
  onLoadSample: () => void;
}

type Width = 'desktop' | 'mobile';
type Bg = 'light' | 'dark';

function Segmented<T extends string>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: ReactNode }[]; label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            value === o.value
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function SignaturePreview({ data, template, onLoadSample }: Props) {
  const { addToast } = useToast();
  const [width, setWidth] = useState<Width>('desktop');
  const [bg, setBg] = useState<Bg>('light');
  const [showHtml, setShowHtml] = useState(false);

  const html = useMemo(() => template.render(data, { iconBaseUrl: LOCAL_ICON_BASE }), [data, template]);
  const exportHtml = useMemo(() => template.render(data), [data, template]);
  const isEmpty = !data.fullName.trim();

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(exportHtml);
      addToast('HTML copied to clipboard');
    } catch {
      addToast('Could not copy HTML', 'error');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Preview</h3>
        <div className="flex items-center gap-2">
          <Segmented<Width>
            label="Preview width"
            value={width}
            onChange={setWidth}
            options={[
              { value: 'desktop', label: 'Desktop' },
              { value: 'mobile', label: 'Mobile' },
            ]}
          />
          <Segmented<Bg>
            label="Email background"
            value={bg}
            onChange={setBg}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </div>
      </div>

      {/* Email-client window */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-3 text-xs text-gray-400 dark:text-gray-500">New Message</span>
        </div>
        <div className={`p-6 overflow-auto transition-colors ${bg === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}`}>
          <div
            className="transition-all duration-300 mx-auto"
            style={{ maxWidth: width === 'mobile' ? 360 : '100%' }}
          >
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>

      {isEmpty && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-4 py-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">Fields you fill appear here instantly.</p>
          <button
            type="button"
            onClick={onLoadSample}
            className="flex-shrink-0 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Load sample data
          </button>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowHtml((s) => !s)}
          aria-expanded={showHtml}
          className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {showHtml ? '▾ Hide HTML' : '▸ View HTML'}
        </button>
        {showHtml && (
          <div className="mt-2 relative">
            <button
              type="button"
              onClick={copyHtml}
              className="absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
            >
              Copy
            </button>
            <pre className="max-h-64 overflow-auto rounded-lg bg-gray-900 text-gray-100 text-xs p-3 pr-16"><code>{exportHtml}</code></pre>
          </div>
        )}
      </div>
    </div>
  );
}
