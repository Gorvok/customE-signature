import { useId, useRef, useState } from 'react';
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
  const urlId = useId();
  const dropHintId = useId();

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
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Logo</span>
      {/* The drop target is passive; the real control is the button inside it. */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-400/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
      >
        {value && (
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={value} alt="Current logo" className="max-h-12" />
            <button type="button" onClick={() => onChange('')} className="text-xs font-medium text-danger hover:underline">
              Remove logo
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-describedby={dropHintId}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {value ? 'Choose a different logo' : 'Upload a logo'}
        </button>
        <p id={dropHintId} className="mt-1 text-xs text-hint">
          PNG, JPG or SVG up to 5 MB. You can also drop an image here.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          aria-label="Logo image file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            // Reset so choosing the same file again (after Remove) fires onChange.
            e.target.value = '';
          }}
        />
      </div>
      <label htmlFor={urlId} className="block text-xs text-hint">
        Or paste an image URL
      </label>
      <input
        id={urlId}
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
