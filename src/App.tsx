import { lazy, useMemo, useState } from 'react';
import { getTemplate } from './templates';
import { sampleData } from './data/sampleData';
import { useTheme } from './theme';
import { useToast } from './toast';
import { REPLACE_PROMPT, hasContent, useSignatureState } from './hooks/useSignatureState';
import SignatureForm from './components/SignatureForm';
import SignaturePreview from './components/SignaturePreview';
import TemplateSelector from './components/TemplateSelector';
import ExportPanel from './components/ExportPanel';
import SharePanel from './components/SharePanel';
import SignatureLibrary from './components/SignatureLibrary';
import BrandMark from './components/BrandMark';
import MobileActionBar from './components/MobileActionBar';
import LazySection from './components/LazySection';

// Loaded when their section is first opened, not on every visit.
const TeamPanel = lazy(() => import('./components/TeamPanel'));
const SignatureCheck = lazy(() => import('./components/SignatureCheck'));
import UpdatePrompt from './components/UpdatePrompt';

export default function App() {
  const { data, templateId, setData, setTemplateId, applyConfig, reset, signatures, pendingShare, acceptPending, dismissPending } =
    useSignatureState();
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const { theme, toggle } = useTheme();
  const { addToast } = useToast();

  function handleReset() {
    // A confirm dialog makes every reset cost two clicks to protect the rare
    // mistake. Undo costs nothing until the mistake happens.
    const previous = data;
    reset();
    addToast('Cleared all fields', 'info', { label: 'Undo', onClick: () => setData(previous) });
  }

  function handleLoadSample() {
    setData(sampleData);
    setMobileTab('preview');
    addToast('Loaded sample data');
  }

  const template = getTemplate(templateId);
  // Until there is something of the person's own, the thumbnails show the
  // sample: seven near-identical empty boxes say nothing about the templates.
  const blank = !hasContent(data);
  const exportHtml = useMemo(() => template.render(data), [template, data]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur px-4 sm:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* The ink tile is nearly the colour of the dark header, so on dark
                the seal stands free rather than sitting on an edge you can
                only just make out. */}
            <BrandMark
              size={40}
              variant={theme === 'dark' ? 'bare' : 'dark'}
              className="w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 rounded-xl"
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white truncate leading-tight">Envoi</h1>
              <p className="text-[11px] sm:text-sm text-muted truncate">Email signature generator — free, no login</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex flex-shrink-0 text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg transition-colors"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 lg:pb-8 space-y-6">
        {/* A share link that would overwrite saved work asks here, on the
            page, rather than in a browser dialog that arrives before the page
            can be seen. */}
        {pendingShare && (
          <div
            role="alertdialog"
            aria-labelledby="share-prompt"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-accent-border bg-accent-surface px-4 py-3"
          >
            <p id="share-prompt" className="flex-1 min-w-64 text-sm text-accent-text">
              {REPLACE_PROMPT}
              {pendingShare.data.fullName.trim() && (
                <span className="block text-xs opacity-80">
                  The link holds a signature for {pendingShare.data.fullName.trim()}.
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  acceptPending();
                  addToast('Loaded the signature from the link');
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-accent-fg transition-colors"
              >
                Replace mine
              </button>
              <button
                type="button"
                onClick={dismissPending}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-accent-text hover:bg-accent-surface transition-colors"
              >
                Keep mine
              </button>
            </div>
          </div>
        )}

        {/* Template Selector */}
        <TemplateSelector
          selected={templateId}
          onSelect={setTemplateId}
          previewData={blank ? sampleData : data}
          showingSample={blank}
        />

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
          <div className={`${mobileTab === 'edit' ? 'block' : 'hidden lg:block'} space-y-4`}>
            <SignatureLibrary
              items={signatures.items}
              activeId={signatures.activeId}
              onSelect={signatures.select}
              onCreate={signatures.create}
              onDuplicate={signatures.duplicate}
              onRename={signatures.rename}
              onRemove={signatures.remove}
            />
            <SignatureForm data={data} onChange={setData} />
          </div>
          <div className={`${mobileTab === 'preview' ? 'block' : 'hidden lg:block'} space-y-8 lg:sticky lg:top-24 lg:self-start`}>
            <SignaturePreview data={data} template={template} onLoadSample={handleLoadSample} />
            <ExportPanel data={data} template={template} />
            <SharePanel data={data} templateId={templateId} onLoad={applyConfig} />
          </div>
        </div>

        {/* Everything above is one person's signature; this makes everyone's.
            Both of these are whole features most visits never open, so they
            are loaded when they are asked for. */}
        <LazySection
          id="sec-team"
          title="Team mode"
          subtitle="One signature per person, from a CSV"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        >
          <TeamPanel data={data} template={template} templateId={templateId} />
        </LazySection>

        {/* For the signature someone arrived with, rather than one made here. */}
        <LazySection
          id="sec-check"
          title="Check a signature you already have"
          subtitle="Paste its HTML to see what breaks"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        >
          <SignatureCheck />
        </LazySection>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted">
          Open source email signature generator. Your details are saved in this browser only — nothing is sent to a server.
        </div>
      </footer>
      <MobileActionBar html={exportHtml} onShowPreview={() => setMobileTab('preview')} />
      <UpdatePrompt />
    </div>
  );
}
