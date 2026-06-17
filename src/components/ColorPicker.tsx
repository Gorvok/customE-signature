import { useId } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export default function ColorPicker({ label, value, onChange }: Props) {
  const id = useId();
  // The native color input only accepts a 7-char hex; fall back to black so it
  // stays in sync while the user is mid-edit in the text field.
  const colorValue = HEX_RE.test(value) ? value : '#000000';

  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-28">{label}</label>
      <input
        id={id}
        type="color"
        value={colorValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer bg-transparent"
      />
      <input
        type="text"
        aria-label={`${label} hex value`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm text-gray-900 dark:text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
      />
    </div>
  );
}
