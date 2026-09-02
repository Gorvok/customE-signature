import { useCallback, useEffect, useRef, useState } from 'react';
import type { SignatureData } from '../types';
import { templates } from '../templates';
import { defaultData } from '../data/defaults';
import { LEGACY_SIGNATURE_STORAGE_KEY, SIGNATURE_STORAGE_KEY } from '../data/storage';
import { parseSharedConfig, parseSignatureData } from '../utils/parseConfig';
import { readConfigFromHash, type SharedConfig } from '../utils/shareConfig';

interface Stored {
  data: SignatureData;
  templateId: string;
}

type Confirm = (message: string) => boolean;

const DEFAULT_TEMPLATE_ID = templates[0].id;
const HAS_SHARE_FRAGMENT = /(?:^#|&)cfg=/;

export const REPLACE_PROMPT = 'This link contains a signature. Replace the one saved in this browser with it?';

const defaultConfirm: Confirm = (message) => window.confirm(message);

function isTemplateId(id: unknown): id is string {
  return typeof id === 'string' && templates.some((t) => t.id === id);
}

/** Saved state from this browser, migrating the pre-1.1 data-only key. Never throws. */
function readStored(): Stored {
  try {
    const raw = localStorage.getItem(SIGNATURE_STORAGE_KEY);
    if (raw) {
      const config = parseSharedConfig(JSON.parse(raw));
      if (config) return { data: config.data, templateId: config.templateId ?? DEFAULT_TEMPLATE_ID };
    }
    const legacy = localStorage.getItem(LEGACY_SIGNATURE_STORAGE_KEY);
    if (legacy) return { data: parseSignatureData(JSON.parse(legacy)), templateId: DEFAULT_TEMPLATE_ID };
  } catch {
    // Malformed or unavailable storage: start fresh.
  }
  return { data: defaultData, templateId: DEFAULT_TEMPLATE_ID };
}

function merge(stored: Stored, config: SharedConfig): Stored {
  return {
    data: parseSignatureData(config.data),
    templateId: isTemplateId(config.templateId) ? config.templateId : stored.templateId,
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

function initialState(confirm: Confirm): Stored {
  const stored = readStored();
  const shared = readConfigFromHash();
  if (!shared) return stored;
  const key = window.location.hash;
  let decision = decisions.get(key);
  if (decision === undefined) {
    decision = mayReplace(stored.data, shared.data, confirm);
    decisions.set(key, decision);
  }
  return decision ? merge(stored, shared) : stored;
}

function stripShareFragment() {
  if (HAS_SHARE_FRAGMENT.test(window.location.hash)) {
    decisions.delete(window.location.hash);
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

interface Options {
  /** Overridable for tests; defaults to window.confirm. */
  confirm?: Confirm;
}

/**
 * The signature being edited and its template, restored from this browser,
 * autosaved on every change, and replaceable from a share link (#cfg=...)
 * on load or when one is pasted into an open tab. Saved work is only
 * replaced with the user's consent, and the fragment is stripped afterwards
 * so a reload does not ask again.
 */
export function useSignatureState({ confirm }: Options = {}) {
  const [state, setState] = useState<Stored>(() => initialState(confirm ?? defaultConfirm));
  const { data, templateId } = state;

  const setData = useCallback((next: SignatureData) => setState((s) => ({ ...s, data: next })), []);
  const setTemplateId = useCallback(
    (next: string) => setState((s) => (isTemplateId(next) ? { ...s, templateId: next } : s)),
    [],
  );
  const applyConfig = useCallback((config: SharedConfig) => setState((s) => merge(s, config)), []);
  const reset = useCallback(() => setState((s) => ({ ...s, data: defaultData })), []);

  // Persist, and retire the legacy key once the new one holds the data.
  useEffect(() => {
    try {
      localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify({ data, templateId }));
      localStorage.removeItem(LEGACY_SIGNATURE_STORAGE_KEY);
    } catch {
      // Storage may be unavailable (private mode, quota); editing still works for this visit.
    }
  }, [data, templateId]);

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

  return { data, templateId, setData, setTemplateId, applyConfig, reset };
}
