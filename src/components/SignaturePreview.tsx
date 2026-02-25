import { useMemo } from 'react';
import type { SignatureData, SignatureTemplate } from '../types';

interface Props {
  data: SignatureData;
  template: SignatureTemplate;
}

export default function SignaturePreview({ data, template }: Props) {
  const html = useMemo(() => template.render(data), [data, template]);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Preview</h3>
      <div className="bg-white rounded-lg p-6 overflow-auto">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
