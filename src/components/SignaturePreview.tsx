import { useMemo } from 'react';
import type { SignatureData, SignatureTemplate } from '../types';
import { LOCAL_ICON_BASE } from '../utils/templateHelpers';

interface Props {
  data: SignatureData;
  template: SignatureTemplate;
}

export default function SignaturePreview({ data, template }: Props) {
  const html = useMemo(
    () => template.render(data, { iconBaseUrl: LOCAL_ICON_BASE }),
    [data, template],
  );

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Preview</h3>
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-300 p-6 overflow-auto shadow-sm">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
