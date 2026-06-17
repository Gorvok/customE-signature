export interface Palette {
  name: string;
  primary: string;
  secondary: string;
}

/** Curated color pairs (primary = accent/background, secondary = light text). */
export const palettes: Palette[] = [
  { name: 'Midnight', primary: '#0f172a', secondary: '#f8fafc' },
  { name: 'Ocean', primary: '#0369a1', secondary: '#e0f2fe' },
  { name: 'Forest', primary: '#166534', secondary: '#dcfce7' },
  { name: 'Plum', primary: '#6d28d9', secondary: '#f5f3ff' },
  { name: 'Sunset', primary: '#c2410c', secondary: '#fff7ed' },
  { name: 'Rose', primary: '#be123c', secondary: '#fff1f2' },
  { name: 'Slate', primary: '#334155', secondary: '#f1f5f9' },
  { name: 'Mono', primary: '#111827', secondary: '#ffffff' },
];
