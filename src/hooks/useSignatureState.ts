import { useCallback, useEffect, useRef, useState } from 'react';
import type { SavedSignature, SignatureData } from '../types';
import { DEFAULT_TEMPLATE, isTemplateId } from '../templates';
import { defaultData } from '../data/defaults';
import { LIMITS, MAX_SIGNATURES } from '../data/options';
import {
  LEGACY_SIGNATURE_STORAGE_KEY,
  LIBRARY_STORAGE_KEY,
  SIGNATURE_STORAGE_KEY,
} from '../data/storage';
import { parseLibrary, parseSharedConfig, parseSignatureData, type SignatureLibrary } from '../utils/parseConfig';
import { readConfigFromHash, type SharedConfig } from '../utils/shareConfig';

type Confirm = (message: string) => boolean;

const DEFAULT_TEMPLATE_ID = DEFAULT_TEMPLATE.id;
const HAS_SHARE_FRAGMENT = /(?:^#|&)cfg=/;

export const REPLACE_PROMPT = 'This link contains a signature. Replace the one saved in this browser with it?';
export const FIRST_SIGNATURE_NAME = 'My signature';
export const AT_CAPACITY = `A browser can hold ${MAX_SIGNATURES} signatures. Delete one first.`;

const defaultConfirm: Confirm = (message) => window.confirm(message);

function newId(): string {
  // randomUUID needs a secure context; the fallback only has to be unique
  // within one browser's library.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `sig-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const signature = (name: string, data: SignatureData, templateId: string): SavedSignature => ({
  id: newId(),
  name,
  data,
  templateId,
});

const libraryOf = (name: string, data: SignatureData, templateId: string): SignatureLibrary => {
  const only = signature(name, data, templateId);
  return { activeId: only.id, items: [only] };
};

/**
 * The library saved in this browser, migrating the two older single-signature
 * keys in turn. Never throws: unreadable or malformed storage starts fresh.
 */
function readLibrary(): SignatureLibrary {
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (raw) {
      const parsed = parseLibrary(JSON.parse(raw));
      if (parsed) return parsed;
    }
    const single = localStorage.getItem(SIGNATURE_STORAGE_KEY);
    if (single) {
      const config = parseSharedConfig(JSON.parse(single));
      if (config) {
        return libraryOf(FIRST_SIGNATURE_NAME, config.data, config.templateId ?? DEFAULT_TEMPLATE_ID);
      }
    }
    const legacy = localStorage.getItem(LEGACY_SIGNATURE_STORAGE_KEY);
    if (legacy) {
      return libraryOf(FIRST_SIGNATURE_NAME, parseSignatureData(JSON.parse(legacy)), DEFAULT_TEMPLATE_ID);
    }
  } catch {
    // Malformed or unavailable storage: start fresh.
  }
  return libraryOf(FIRST_SIGNATURE_NAME, defaultData, DEFAULT_TEMPLATE_ID);
}

/** The active entry, falling back to the first so the editor always has one. */
function activeOf(library: SignatureLibrary): SavedSignature {
  return library.items.find((item) => item.id === library.activeId) ?? library.items[0]!;
}

function patchActive(library: SignatureLibrary, patch: Partial<SavedSignature>): SignatureLibrary {
  const activeId = activeOf(library).id;
  return {
    ...library,
    items: library.items.map((item) => (item.id === activeId ? { ...item, ...patch } : item)),
  };
}

function merge(current: SavedSignature, config: SharedConfig): Partial<SavedSignature> {
  return {
    data: parseSignatureData(config.data),
    templateId: isTemplateId(config.templateId) ? config.templateId : current.templateId,
  };
}

const CONTENT_FIELDS = [
  'fullName', 'pronouns', 'jobTitle', 'department', 'company', 'phone', 'email', 'website',
  'address', 'bookingLink', 'logoUrl', 'ctaLabel', 'ctaUrl', 'disclaimer',
] as const;

/** True when the user has typed or uploaded anything worth protecting. */
export function hasContent(data: SignatureData): boolean {
  return CONTENT_FIELDS.some((field) => data[field].trim()) || Object.values(data.socials).some((v) => v.trim());
}

function sameData(a: SignatureData, b: SignatureData): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Whether a share link may replace what is saved: yes when there is nothing to lose, otherwise ask. */
function mayReplace(current: SignatureData, incoming: SignatureData, confirm: Confirm): boolean {
  return !hasContent(current) || sameData(current, incoming) || confirm(REPLACE_PROMPT);
}

/**
 * Answers already given for a link, so React StrictMode's double-invoked
 * state initializer asks once. Entries are dropped once the fragment is
 * stripped after mount.
 */
const decisions = new Map<string, boolean>();

function initialState(confirm: Confirm): SignatureLibrary {
  const library = readLibrary();
  const shared = readConfigFromHash();
  if (!shared) return library;
  const key = window.location.hash;
  let decision = decisions.get(key);
  if (decision === undefined) {
    decision = mayReplace(activeOf(library).data, shared.data, confirm);
    decisions.set(key, decision);
  }
  return decision ? patchActive(library, merge(activeOf(library), shared)) : library;
}

function stripShareFragment() {
  if (HAS_SHARE_FRAGMENT.test(window.location.hash)) {
    decisions.delete(window.location.hash);
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

/** A name that does not collide with one already in the library. */
function uniqueName(items: SavedSignature[], base: string): string {
  const taken = new Set(items.map((item) => item.name));
  if (!taken.has(base)) return base;
  for (let n = 2; n <= MAX_SIGNATURES + 1; n++) {
    const candidate = `${base} ${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return base;
}

const cleanName = (name: string) => name.trim().slice(0, LIMITS.signatureName);

interface Options {
  /** Overridable for tests; defaults to window.confirm. */
  confirm?: Confirm;
}

/**
 * The signature being edited, its template, and the other signatures saved
 * alongside it in this browser. There is no account: the library lives in
 * localStorage, and a share link is how a signature reaches another device.
 *
 * Autosaved on every change, and replaceable from a share link (#cfg=...) on
 * load or when one is pasted into an open tab. Saved work is only replaced
 * with the user's consent, and the fragment is stripped afterwards so a
 * reload does not ask again.
 */
export function useSignatureState({ confirm }: Options = {}) {
  const [library, setLibrary] = useState<SignatureLibrary>(() => initialState(confirm ?? defaultConfirm));
  const active = activeOf(library);
  const { data, templateId } = active;

  const setData = useCallback((next: SignatureData) => setLibrary((s) => patchActive(s, { data: next })), []);
  const setTemplateId = useCallback(
    (next: string) => setLibrary((s) => (isTemplateId(next) ? patchActive(s, { templateId: next }) : s)),
    [],
  );
  const applyConfig = useCallback(
    (config: SharedConfig) => setLibrary((s) => patchActive(s, merge(activeOf(s), config))),
    [],
  );
  const reset = useCallback(() => setLibrary((s) => patchActive(s, { data: defaultData })), []);

  const select = useCallback((id: string) => {
    setLibrary((s) => (s.items.some((item) => item.id === id) ? { ...s, activeId: id } : s));
  }, []);

  // The cap is reported from the state this render already has: a functional
  // updater does not run synchronously, so a reason set inside one would
  // always arrive too late to return.
  const full = library.items.length >= MAX_SIGNATURES;

  /** Adds a blank signature and switches to it. Returns a reason when it cannot. */
  const create = useCallback((): string | null => {
    if (full) return AT_CAPACITY;
    setLibrary((s) => {
      if (s.items.length >= MAX_SIGNATURES) return s;
      const added = signature(uniqueName(s.items, 'Signature'), defaultData, DEFAULT_TEMPLATE_ID);
      return { activeId: added.id, items: [...s.items, added] };
    });
    return null;
  }, [full]);

  /** Copies a signature and switches to the copy. Returns a reason when it cannot. */
  const duplicate = useCallback((id: string): string | null => {
    if (full) return AT_CAPACITY;
    setLibrary((s) => {
      if (s.items.length >= MAX_SIGNATURES) return s;
      const source = s.items.find((item) => item.id === id);
      if (!source) return s;
      const copy = signature(uniqueName(s.items, `${source.name} copy`), source.data, source.templateId);
      return { activeId: copy.id, items: [...s.items, copy] };
    });
    return null;
  }, [full]);

  const rename = useCallback((id: string, name: string) => {
    const next = cleanName(name);
    if (!next) return;
    setLibrary((s) => ({
      ...s,
      items: s.items.map((item) => (item.id === id ? { ...item, name: uniqueName(s.items.filter((i) => i.id !== id), next) } : item)),
    }));
  }, []);

  /** Removes a signature. The library is never empty: the last one is replaced by a blank. */
  const remove = useCallback((id: string) => {
    setLibrary((s) => {
      const remaining = s.items.filter((item) => item.id !== id);
      if (!remaining.length) return libraryOf(FIRST_SIGNATURE_NAME, defaultData, DEFAULT_TEMPLATE_ID);
      const activeId = s.activeId === id ? remaining[0]!.id : s.activeId;
      return { activeId, items: remaining };
    });
  }, []);

  // Persist, and retire the single-signature keys once the library holds them.
  useEffect(() => {
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
      localStorage.removeItem(SIGNATURE_STORAGE_KEY);
      localStorage.removeItem(LEGACY_SIGNATURE_STORAGE_KEY);
    } catch {
      // Storage may be unavailable (private mode) or full (an uploaded logo is
      // up to 1.5 MB); editing still works for this visit.
    }
  }, [library]);

  // The fragment consumed by the initializer is removed once mounted.
  useEffect(stripShareFragment, []);

  // A link pasted into an already-open tab only changes the hash.
  const dataRef = useRef(data);
  const confirmRef = useRef(confirm ?? defaultConfirm);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    confirmRef.current = confirm ?? defaultConfirm;
  }, [confirm]);
  useEffect(() => {
    const onHashChange = () => {
      const config = readConfigFromHash();
      if (!config) return;
      if (mayReplace(dataRef.current, config.data, confirmRef.current)) applyConfig(config);
      stripShareFragment();
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [applyConfig]);

  return {
    data,
    templateId,
    setData,
    setTemplateId,
    applyConfig,
    reset,
    /** Every saved signature, the active one, and the operations on them. */
    signatures: { items: library.items, activeId: active.id, select, create, duplicate, rename, remove },
  };
}
