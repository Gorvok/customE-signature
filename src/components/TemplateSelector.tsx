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
      style={{ transform: 'scale(0.45)', transformOrigin: 'top left', width: '222%', height: 80 }}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default function TemplateSelector({ selected, onSelect, previewData }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Template</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={`rounded-lg border-2 p-2 text-left transition-colors ${
              selected === t.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
            }`}
          >
            <div className="h-16 overflow-hidden rounded mb-2">
              <MiniPreview template={t} data={previewData} />
            </div>
            <p className="text-sm font-medium text-white">{t.name}</p>
            <p className="text-xs text-gray-400">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
