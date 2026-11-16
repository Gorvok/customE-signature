import { useEffect, useMemo, useRef, useState } from 'react';
import type { SignatureData, SignatureTemplate } from '../types';
import { templates } from '../templates';
import { LOCAL_ICON_BASE } from '../utils/templateHelpers';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import SignatureFrame from './SignatureFrame';

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  previewData: SignatureData;
  /**
   * True when `previewData` is the sample rather than the person's own
   * details, so the thumbnails say so instead of looking broken.
   */
  showingSample?: boolean;
}

/**
 * A thumbnail of one template, scaled to fit its box.
 *
 * The frame is laid out at a fixed width and then scaled with a transform, so
 * the signature inside never reflows as the scale changes — which would
 * otherwise feed the measurement back into itself. Signatures differ in
 * height by a factor of three, so a single fixed scale either clipped the tall
 * ones mid-row or left the short ones floating in white space.
 */
const THUMBNAIL_WIDTH = 520;

function MiniPreview({ template, data }: { template: SignatureTemplate; data: SignatureData }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [contentHeight, setContentHeight] = useState(0);

  const html = useMemo(
    () => template.render(data, { iconBaseUrl: LOCAL_ICON_BASE }),
    [template, data],
  );

  useEffect(() => {
    const node = boxRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const measure = () => setBox({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Fit by width, and by height too once the frame has reported one. Never
  // enlarge: a one-line signature should not be blown up to fill the card.
  const scale = Math.min(
    1,
    box.width ? box.width / THUMBNAIL_WIDTH : 1,
    contentHeight && box.height ? box.height / contentHeight : 1,
  );

  return (
    <div ref={boxRef} className="h-full w-full overflow-hidden bg-white pointer-events-none">
      <div style={{ width: THUMBNAIL_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <SignatureFrame
          html={html}
          title={`${template.name} thumbnail`}
          decorative
          onMeasure={(height) => setContentHeight(height)}
        />
      </div>
    </div>
  );
}

export default function TemplateSelector({ selected, onSelect, previewData, showingSample = false }: Props) {
  // Seven sandboxed frames re-parse their documents on every change, so wait
  // for typing to pause rather than rendering on each keystroke.
  const data = useDebouncedValue(previewData, 150);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Template</h2>
        {showingSample && (
          <p className="text-xs text-hint">Previews use sample details until you type your own.</p>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {templates.map((t) => {
          const active = selected === t.id;
          return (
            // The thumbnail sits beside the button, not inside it, so the button's
            // name is the template's name and no interactive content is nested. The
            // button's ::after stretches over the whole card to keep it clickable.
            <div
              key={t.id}
              className={`relative w-[62%] flex-shrink-0 snap-start sm:w-auto sm:flex-shrink rounded-xl border-2 p-3 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-ring has-[:focus-visible]:ring-offset-2 dark:has-[:focus-visible]:ring-offset-gray-950 ${
                active
                  ? 'border-accent-ring bg-accent-surface shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="h-24 overflow-hidden rounded-lg mb-2 border border-gray-100 dark:border-gray-700">
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
