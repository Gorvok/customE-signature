import { useRef, useState } from 'react';
import { fileToBase64 } from '../utils/imageUtils';
import { LIMITS } from '../data/options';
import { useToast } from '../toast';

interface Props {
  value: string;
  onChange: (dataUri: string) => void;
}

export default function ImageUploader({ value, onChange }: Props) {
  const { addToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  // Serial number of the latest file chosen, so an earlier, slower decode
  // cannot overwrite a later one.
  const requestRef = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    const request = ++requestRef.current;
    try {
      const dataUri = await fileToBase64(file, 200);
      if (request !== requestRef.current) return;
      onChange(dataUri);
    } catch (err) {
      if (request !== requestRef.current) return;
      addToast(err instanceof Error ? err.message : 'Could not read that image.', 'error');
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Logo</label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-400/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
      >
        {value ? (
          <div className="flex items-center justify-center gap-3">
            <img src={value} alt="Logo preview" className="max-h-12" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="text-xs text-red-500 hover:text-red-400"
            >
              Remove
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
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
            if (file) void handleFile(file);
            // Reset so choosing the same file again (after Remove) fires onChange.
            e.target.value = '';
          }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-500">Or paste a URL:</div>
      <input
        type="url"
        placeholder="https://example.com/logo.png"
        maxLength={LIMITS.url}
        value={value.startsWith('data:') ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
      />
    </div>
  );
}
