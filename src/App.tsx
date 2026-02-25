import { useState } from 'react';
import type { SignatureData } from './types';
import { templates } from './templates';
import SignatureForm from './components/SignatureForm';
import SignaturePreview from './components/SignaturePreview';
import TemplateSelector from './components/TemplateSelector';
import ExportPanel from './components/ExportPanel';

const defaultData: SignatureData = {
  fullName: '',
  jobTitle: '',
  company: '',
  phone: '',
  email: '',
  website: '',
  socials: {},
  logoUrl: '',
  primaryColor: '#000000',
  secondaryColor: '#FFFFFF',
  fontFamily: 'Inter',
};

export default function App() {
  const [data, setData] = useState<SignatureData>(defaultData);
  const [templateId, setTemplateId] = useState(templates[0].id);

  const template = templates.find((t) => t.id === templateId) ?? templates[0];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Email Signature Generator</h1>
            <p className="text-sm text-gray-400">Free &amp; open source — no login required</p>
          </div>
          <a
            href="https://github.com/Gorvok/customE-signature"
            target="_blank"
            rel="noopener"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Template Selector */}
        <TemplateSelector selected={templateId} onSelect={setTemplateId} previewData={data} />

        {/* Two-column: Form + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SignatureForm data={data} onChange={setData} />
          <div className="space-y-8">
            <SignaturePreview data={data} template={template} />
            <ExportPanel data={data} template={template} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          Open source email signature generator. No data is stored — everything runs in your browser.
        </div>
      </footer>
    </div>
  );
}
