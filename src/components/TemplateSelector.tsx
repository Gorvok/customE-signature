import { useMemo } from 'react';
import type { SignatureData, SignatureTemplate } from '../types';
import { templates } from '../templates';

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  previewData: SignatureData;
}

function MiniPreview({ template, data }: { template: SignatureTemplate; data: SignatureData }) {
  const html = useMemo(() => template.render(data), [template, data]);
  return (
    <div
      className="bg-white rounded p-2 overflow-hidden pointer-events-none"
      style={{ transform: 'scale(0.45)', transformOrigin: 'top left', width: '222%', height: 90 }}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default function TemplateSelector({ selected, onSelect, previewData }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Template</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={`rounded-xl border-2 p-3 text-left transition-all ${
              selected === t.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-sm'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="h-20 overflow-hidden rounded-lg mb-2 border border-gray-100 dark:border-gray-700">
              <MiniPreview template={t} data={previewData} />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
