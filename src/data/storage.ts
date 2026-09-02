/**
 * localStorage keys, kept in one place so the error boundary can clear them
 * all. The inline theme bootstrap in index.html reads the theme key by its
 * literal value; keep the two in sync.
 */
export const SIGNATURE_STORAGE_KEY = 'signature-data';
export const THEME_STORAGE_KEY = 'theme';

export const STORAGE_KEYS = [SIGNATURE_STORAGE_KEY, THEME_STORAGE_KEY] as const;
