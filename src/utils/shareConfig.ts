import type { SignatureData } from '../types';
import { parseSharedConfig } from './parseConfig';

export interface SharedConfig {
  data: SignatureData;
  /** Omitted when the source named no template or an unknown one. */
  templateId?: string;
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Serialize a config to a compact, URL-safe string. */
export function encodeConfig(config: SharedConfig): string {
  return toBase64Url(JSON.stringify(config));
}

/**
 * Parse a config produced by encodeConfig. Returns null on malformed input;
 * otherwise every field is validated and coerced, never trusted as-is.
 */
export function decodeConfig(encoded: string): SharedConfig | null {
  try {
    return parseSharedConfig(JSON.parse(fromBase64Url(encoded)));
  } catch {
    return null;
  }
}

/**
 * The config to embed in a share link. Uploaded logos are base64 data URLs
 * that make links tens of kilobytes long, which chat apps and some browsers
 * truncate, so they are left out; hosted logo URLs are kept.
 */
export function forShareLink(config: SharedConfig): { config: SharedConfig; droppedLogo: boolean } {
  const droppedLogo = config.data.logoUrl.startsWith('data:');
  if (!droppedLogo) return { config, droppedLogo };
  return { config: { ...config, data: { ...config.data, logoUrl: '' } }, droppedLogo };
}

/** Build a full shareable URL embedding the config in the hash fragment. */
export function buildShareUrl(config: SharedConfig): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#cfg=${encodeConfig(config)}`;
}

/** Read a config from the current URL hash (e.g. #cfg=...), or null. */
export function readConfigFromHash(): SharedConfig | null {
  const match = window.location.hash.match(/(?:^#|&)cfg=([^&]+)/);
  return match ? decodeConfig(match[1]) : null;
}
