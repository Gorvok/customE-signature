/** Loose email check — good enough for inline UX hints, not RFC-complete. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Loose URL check that accepts values with or without a protocol
 * (e.g. "example.com/path" or "https://example.com"). Requires a dot and
 * forbids whitespace.
 */
export function isLikelyUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return /^(https?:\/\/)?[^\s./]+(\.[^\s./]+)+(\/\S*)?$/.test(v);
}
