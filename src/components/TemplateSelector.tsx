import { useMemo } from 'react';
import type { SignatureData, SignatureTemplate } from '../types';
import { templates } from '../templates';
import { LOCAL_ICON_BASE } from '../utils/templateHelpers';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import SignatureFrame from './SignatureFrame';

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  previewData: SignatureData;
}

function MiniPreview({ template, data }: { template: SignatureTemplate; data: SignatureData }) {
  const html = useMemo(
    () => template.render(data, { iconBaseUrl: LOCAL_ICON_BASE }),
    [template, data],
  );
  return (
    <div
      className="bg-white rounded p-2 overflow-hidden pointer-events-none"
      style={{ transform: 'scale(0.45)', transformOrigin: 'top left', width: '222%', height: 90 }}
    >
      <SignatureFrame html={html} title={`${template.name} thumbnail`} decorative />
    </div>
  );
}

export default function TemplateSelector({ selected, onSelect, previewData }: Props) {
  // Seven sandboxed frames re-parse their documents on every change, so wait
  // for typing to pause rather than rendering on each keystroke.
  const data = useDebouncedValue(previewData, 150);

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Template</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {templates.map((t) => {
          const active = selected === t.id;
          return (
            // The thumbnail sits beside the button, not inside it, so the button's
            // name is the template's name and no interactive content is nested. The
            // button's ::after stretches over the whole card to keep it clickable.
            <div
              key={t.id}
              className={`relative rounded-xl border-2 p-3 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-2 dark:has-[:focus-visible]:ring-offset-gray-950 ${
                active
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="h-20 overflow-hidden rounded-lg mb-2 border border-gray-100 dark:border-gray-700">
                <MiniPreview template={t} data={data} />
              </div>
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                aria-pressed={active}
                aria-label={t.name}
                className="block w-full text-left focus:outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
              >
                <span className="block text-sm font-medium text-gray-900 dark:text-white">{t.name}</span>
                <span className="block text-xs text-hint">{t.description}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
