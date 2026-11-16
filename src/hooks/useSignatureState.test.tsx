// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { hasContent, useSignatureState } from './useSignatureState';
import { encodeConfig } from '../utils/shareConfig';
import { sampleData } from '../data/sampleData';
import { defaultData } from '../data/defaults';
import { LEGACY_SIGNATURE_STORAGE_KEY, LIBRARY_STORAGE_KEY, SIGNATURE_STORAGE_KEY } from '../data/storage';
import type { SignatureData } from '../types';

const fragment = (data: SignatureData, templateId?: string) => `#cfg=${encodeConfig({ data, templateId })}`;

interface StoredShape {
  data?: { fullName?: string };
  templateId?: string;
}

/** The active entry of the persisted library. */
function stored(): StoredShape {
  const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
  if (!raw) return {};
  const library = JSON.parse(raw) as { activeId?: string; items?: (StoredShape & { id: string })[] };
  const items = library.items ?? [];
  return items.find((item) => item.id === library.activeId) ?? items[0] ?? {};
}

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
});

afterEach(() => {
  // Unmount every hook so its hashchange listener cannot consume a later test's link.
  cleanup();
  history.replaceState(null, '', '/');
});

/** Simulate a link pasted into the address bar of an open tab: the URL changes, then hashchange fires. */
function pasteLink(hash: string) {
  history.replaceState(null, '', '/' + hash);
  window.dispatchEvent(new Event('hashchange'));
}

describe('hasContent', () => {
  it('is false for the defaults and true once anything is typed', () => {
    expect(hasContent(defaultData)).toBe(false);
    expect(hasContent({ ...defaultData, primaryColor: '#123456' })).toBe(false);
    expect(hasContent({ ...defaultData, fullName: 'Jane' })).toBe(true);
    expect(hasContent({ ...defaultData, socials: { github: 'jane' } })).toBe(true);
  });
});

describe('useSignatureState', () => {
  it('starts from the defaults and persists data and template under the versioned key', () => {
    const { result } = renderHook(() => useSignatureState());
    expect(result.current.data).toEqual(defaultData);

    act(() => {
      result.current.setData({ ...defaultData, fullName: 'Jane' });
      result.current.setTemplateId('minimal');
    });

    expect(result.current.templateId).toBe('minimal');
    expect(stored().data?.fullName).toBe('Jane');
    expect(stored().templateId).toBe('minimal');
  });

  it('restores the saved template on the next load', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify({ data: { fullName: 'Jane' }, templateId: 'elegant' }));
    const { result } = renderHook(() => useSignatureState());
    expect(result.current.data.fullName).toBe('Jane');
    expect(result.current.templateId).toBe('elegant');
  });

  it('migrates the legacy data-only key and removes it', () => {
    localStorage.setItem(LEGACY_SIGNATURE_STORAGE_KEY, JSON.stringify({ fullName: 'Old' }));
    const { result } = renderHook(() => useSignatureState());
    expect(result.current.data.fullName).toBe('Old');
    expect(localStorage.getItem(LEGACY_SIGNATURE_STORAGE_KEY)).toBeNull();
    expect(stored().data?.fullName).toBe('Old');
  });

  it('ignores an unknown template id', () => {
    const { result } = renderHook(() => useSignatureState());
    const before = result.current.templateId;
    act(() => result.current.setTemplateId('nope'));
    expect(result.current.templateId).toBe(before);
  });

  it('reset clears the fields but keeps the template', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify({ data: { fullName: 'Jane' }, templateId: 'elegant' }));
    const { result } = renderHook(() => useSignatureState());
    act(() => result.current.reset());
    expect(result.current.data).toEqual(defaultData);
    expect(result.current.templateId).toBe('elegant');
  });

  it('applies a share link without asking when nothing is saved, then strips the fragment', () => {
    history.replaceState(null, '', '/' + fragment(sampleData, 'corporate'));
    const { result } = renderHook(() => useSignatureState());
    expect(result.current.data.fullName).toBe('Alex Rivera');
    expect(result.current.templateId).toBe('corporate');
    expect(result.current.pendingShare).toBeNull();
    expect(window.location.hash).toBe('');
    expect(stored().data?.fullName).toBe('Alex Rivera');
  });

  it('holds a link that would overwrite saved work, and keeps the work meanwhile', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify({ data: { fullName: 'Jane' }, templateId: 'minimal' }));
    history.replaceState(null, '', '/' + fragment(sampleData));
    const { result } = renderHook(() => useSignatureState());

    expect(result.current.pendingShare?.data.fullName).toBe('Alex Rivera');
    expect(result.current.data.fullName).toBe('Jane');
    expect(result.current.templateId).toBe('minimal');
    // The fragment goes either way: the config is in memory, and a reload
    // should not ask again.
    expect(window.location.hash).toBe('');
  });

  it('keeps the saved signature when the link is dismissed', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify({ data: { fullName: 'Jane' }, templateId: 'minimal' }));
    history.replaceState(null, '', '/' + fragment(sampleData));
    const { result } = renderHook(() => useSignatureState());

    act(() => result.current.dismissPending());

    expect(result.current.pendingShare).toBeNull();
    expect(result.current.data.fullName).toBe('Jane');
    expect(stored().data?.fullName).toBe('Jane');
  });

  it('replaces saved work when the link is accepted', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify({ data: { fullName: 'Jane' }, templateId: 'minimal' }));
    history.replaceState(null, '', '/' + fragment(sampleData, 'elegant'));
    const { result } = renderHook(() => useSignatureState());

    act(() => result.current.acceptPending());

    expect(result.current.pendingShare).toBeNull();
    expect(result.current.data.fullName).toBe('Alex Rivera');
    expect(result.current.templateId).toBe('elegant');
  });

  it('does not ask when the link matches what is already saved', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify({ data: sampleData, templateId: 'minimal' }));
    history.replaceState(null, '', '/' + fragment(sampleData));
    const { result } = renderHook(() => useSignatureState());
    expect(result.current.pendingShare).toBeNull();
  });

  it('applies a link pasted into an open tab when there is nothing to lose', () => {
    const { result } = renderHook(() => useSignatureState());
    act(() => pasteLink(fragment(sampleData, 'elegant')));
    expect(result.current.pendingShare).toBeNull();
    expect(result.current.data.fullName).toBe('Alex Rivera');
    expect(result.current.templateId).toBe('elegant');
    expect(window.location.hash).toBe('');
  });

  it('holds a link pasted over a draft until it is answered', () => {
    const { result } = renderHook(() => useSignatureState());
    act(() => result.current.setData({ ...defaultData, fullName: 'Draft' }));

    act(() => pasteLink(fragment(sampleData)));

    expect(result.current.data.fullName).toBe('Draft');
    expect(result.current.pendingShare?.data.fullName).toBe('Alex Rivera');
    expect(window.location.hash).toBe('');

    act(() => result.current.acceptPending());
    expect(result.current.data.fullName).toBe('Alex Rivera');
  });
});
