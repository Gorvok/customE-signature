import { useState } from 'react';
import { templates } from './templates';
import { sampleData } from './data/sampleData';
import { useTheme } from './theme';
import { useToast } from './toast';
import { useSignatureState } from './hooks/useSignatureState';
import SignatureForm from './components/SignatureForm';
import SignaturePreview from './components/SignaturePreview';
import TemplateSelector from './components/TemplateSelector';
import ExportPanel from './components/ExportPanel';
import SharePanel from './components/SharePanel';

export default function App() {
  const { data, templateId, setData, setTemplateId, applyConfig, reset } = useSignatureState();
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const { theme, toggle } = useTheme();
  const { addToast } = useToast();

  function handleReset() {
    if (window.confirm('Clear all fields and start over?')) {
      reset();
      addToast('Cleared all fields', 'info');
    }
  }

  function handleLoadSample() {
    setData(sampleData);
    setMobileTab('preview');
    addToast('Loaded sample data');
  }

  const template = templates.find((t) => t.id === templateId) ?? templates[0];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur px-4 sm:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Email Signature Generator</h1>
              <p className="hidden sm:block text-sm text-muted">Free &amp; open source — no login required</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleLoadSample}
              className="hidden sm:inline-flex text-sm font-medium px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Load sample
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-muted hover:text-gray-900 dark:hover:text-white transition-colors"
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
              aria-label="View source on GitHub"
              className="hidden sm:inline text-sm text-muted hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Template Selector */}
        <TemplateSelector selected={templateId} onSelect={setTemplateId} previewData={data} />

        {/* Mobile edit/preview switcher */}
        <div className="lg:hidden sticky top-[68px] z-10 -mx-4 px-4 py-2 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur">
          <div role="group" aria-label="View" className="inline-flex w-full rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
            {(['edit', 'preview'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={mobileTab === tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                  mobileTab === tab
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-muted'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Two-column: Form + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={mobileTab === 'edit' ? 'block' : 'hidden lg:block'}>
            <SignatureForm data={data} onChange={setData} />
          </div>
          <div className={`${mobileTab === 'preview' ? 'block' : 'hidden lg:block'} space-y-8 lg:sticky lg:top-24 lg:self-start`}>
            <SignaturePreview data={data} template={template} onLoadSample={handleLoadSample} />
            <ExportPanel data={data} template={template} />
            <SharePanel data={data} templateId={templateId} onLoad={applyConfig} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted">
          Open source email signature generator. Your details are saved in this browser only — nothing is sent to a server.
        </div>
      </footer>
    </div>
  );
}
