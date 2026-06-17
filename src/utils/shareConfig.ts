import type { SignatureData } from '../types';

export interface SharedConfig {
  data: SignatureData;
  templateId: string;
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

/** Parse a config produced by encodeConfig. Returns null on any malformed input. */
export function decodeConfig(encoded: string): SharedConfig | null {
  try {
    const obj = JSON.parse(fromBase64Url(encoded));
    if (obj && typeof obj === 'object' && obj.data && typeof obj.data === 'object') {
      return obj as SharedConfig;
    }
    return null;
  } catch {
    return null;
  }
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
