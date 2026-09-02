/**
 * localStorage keys, kept in one place so the error boundary can clear them
 * all. The inline theme bootstrap in index.html reads the theme key by its
 * literal value; keep the two in sync.
 */

/** Holds `{ data, templateId }` as written by useSignatureState. */
export const SIGNATURE_STORAGE_KEY = 'signature-v2';

/** Pre-1.1 key that held the form data alone; read once for migration, then removed. */
export const LEGACY_SIGNATURE_STORAGE_KEY = 'signature-data';

export const THEME_STORAGE_KEY = 'theme';

export const STORAGE_KEYS = [SIGNATURE_STORAGE_KEY, LEGACY_SIGNATURE_STORAGE_KEY, THEME_STORAGE_KEY] as const;
