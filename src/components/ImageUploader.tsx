import { useRef, useState } from 'react';
import { fileToBase64 } from '../utils/imageUtils';

interface Props {
  value: string;
  onChange: (dataUri: string) => void;
}

export default function ImageUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const base64 = await fileToBase64(file, 200);
    onChange(base64);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">Company Logo</label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-400/10' : 'border-gray-600 hover:border-gray-400'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {value ? (
          <div className="flex items-center justify-center gap-3">
            <img src={value} alt="Logo preview" className="max-h-12" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Drop an image here or click to upload
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      <div className="text-xs text-gray-500">Or paste a URL:</div>
      <input
        type="url"
        placeholder="https://example.com/logo.png"
        value={value.startsWith('data:') ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}
