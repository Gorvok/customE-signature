/**
 * localStorage keys, kept in one place so the error boundary can clear them
 * all. The inline theme bootstrap in index.html reads the theme key by its
 * literal value; keep the two in sync.
 */

/** Holds the whole library: `{ activeId, items: [{ id, name, data, templateId }] }`. */
export const LIBRARY_STORAGE_KEY = 'signatures-v1';

/** Earlier key holding a single `{ data, templateId }`; read once for migration, then removed. */
export const SIGNATURE_STORAGE_KEY = 'signature-v2';

/** The first key, holding the form data alone; read once for migration, then removed. */
export const LEGACY_SIGNATURE_STORAGE_KEY = 'signature-data';

export const THEME_STORAGE_KEY = 'theme';

export const STORAGE_KEYS = [
  LIBRARY_STORAGE_KEY,
  SIGNATURE_STORAGE_KEY,
  LEGACY_SIGNATURE_STORAGE_KEY,
  THEME_STORAGE_KEY,
] as const;
