/**
 * Loose email check for inline UX hints, not RFC-complete: something@domain
 * where the domain has at least one dot and no leading, trailing or doubled
 * dots.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value.trim());
}

/** "Looks like a scheme" without allowing dots, so `example.com:8080` reads as a host and port. */
const LOOSE_SCHEME = /^[a-z][a-z0-9+-]*:/i;

/**
 * Loose URL check that accepts values with or without a protocol
 * (e.g. "example.com/path", "https://example.com", "example.com:8080/x").
 * Requires a dotted host, forbids whitespace and quotes, and rejects any
 * explicit scheme other than http(s) since those become dead links in email.
 */
export function isLikelyUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (LOOSE_SCHEME.test(v) && !/^https?:\/\//i.test(v)) return false;
  return /^(https?:\/\/)?[^\s./:"'<>]+(\.[^\s./:"'<>]+)+(:\d+)?(\/\S*)?$/i.test(v);
}
