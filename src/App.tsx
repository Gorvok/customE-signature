import { useEffect, useState } from 'react';
import type { SignatureData } from './types';
import { templates } from './templates';
import { socialPlatforms } from './data/socialPlatforms';
import { useTheme } from './theme';
import SignatureForm from './components/SignatureForm';
import SignaturePreview from './components/SignaturePreview';
import TemplateSelector from './components/TemplateSelector';
import ExportPanel from './components/ExportPanel';
import SharePanel from './components/SharePanel';
import { readConfigFromHash, type SharedConfig } from './utils/shareConfig';

const defaultData: SignatureData = {
  fullName: '',
  pronouns: '',
  jobTitle: '',
  department: '',
  company: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  bookingLink: '',
  socials: {},
  socialOrder: socialPlatforms.map((p) => p.id),
  logoUrl: '',
  ctaLabel: '',
  ctaUrl: '',
  disclaimer: '',
  primaryColor: '#000000',
  secondaryColor: '#FFFFFF',
  fontFamily: 'Inter',
  iconStyle: 'brand',
};

const STORAGE_KEY = 'signature-data';

// A shared link (#cfg=...) takes precedence over local storage on first load.
const sharedConfig = typeof window !== 'undefined' ? readConfigFromHash() : null;

function loadData(): SignatureData {
  if (sharedConfig) return { ...defaultData, ...sharedConfig.data };
  if (typeof window === 'undefined') return defaultData;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultData, ...JSON.parse(saved) };
  } catch {
    // Ignore malformed/unavailable storage and fall back to defaults.
  }
  return defaultData;
}

function loadTemplateId(): string {
  if (sharedConfig?.templateId && templates.some((t) => t.id === sharedConfig.templateId)) {
    return sharedConfig.templateId;
  }
  return templates[0].id;
}

export default function App() {
  const [data, setData] = useState<SignatureData>(loadData);
  const [templateId, setTemplateId] = useState(loadTemplateId);
  const { theme, toggle } = useTheme();

  function applyConfig(config: SharedConfig) {
    setData({ ...defaultData, ...config.data });
    if (config.templateId && templates.some((t) => t.id === config.templateId)) {
      setTemplateId(config.templateId);
    }
  }

  // Strip the #cfg= fragment once it has been consumed by the initializers.
  useEffect(() => {
    if (window.location.hash.includes('cfg=')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage may be unavailable (private mode, quota) — non-fatal.
    }
  }, [data]);

  function handleReset() {
    if (window.confirm('Clear all fields and start over?')) {
      setData(defaultData);
    }
  }

  const template = templates.find((t) => t.id === templateId) ?? templates[0];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Signature Generator</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Free &amp; open source — no login required</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <a
              href="https://github.com/Gorvok/customE-signature"
              target="_blank"
              rel="noopener"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Template Selector */}
        <TemplateSelector selected={templateId} onSelect={setTemplateId} previewData={data} />

        {/* Two-column: Form + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SignatureForm data={data} onChange={setData} />
          <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <SignaturePreview data={data} template={template} />
            <ExportPanel data={data} template={template} />
            <SharePanel data={data} templateId={templateId} onLoad={applyConfig} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500 dark:text-gray-500">
          Open source email signature generator. No data is stored — everything runs in your browser.
        </div>
      </footer>
    </div>
  );
}
