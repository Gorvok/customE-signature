// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { REPLACE_PROMPT, hasContent, useSignatureState } from './useSignatureState';
import { encodeConfig } from '../utils/shareConfig';
import { sampleData } from '../data/sampleData';
import { defaultData } from '../data/defaults';
import { LEGACY_SIGNATURE_STORAGE_KEY, SIGNATURE_STORAGE_KEY } from '../data/storage';
import type { SignatureData } from '../types';

const fragment = (data: SignatureData, templateId?: string) => `#cfg=${encodeConfig({ data, templateId })}`;

function stored() {
  return JSON.parse(localStorage.getItem(SIGNATURE_STORAGE_KEY) ?? 'null');
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
    expect(stored().data.fullName).toBe('Jane');
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
    expect(stored().data.fullName).toBe('Old');
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
    const confirm = vi.fn(() => false);
    const { result } = renderHook(() => useSignatureState({ confirm }));
    expect(result.current.data.fullName).toBe('Alex Rivera');
    expect(result.current.templateId).toBe('corporate');
    expect(confirm).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('');
    expect(stored().data.fullName).toBe('Alex Rivera');
  });

  it('asks before replacing saved work and keeps it on decline', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify({ data: { fullName: 'Jane' }, templateId: 'minimal' }));
    history.replaceState(null, '', '/' + fragment(sampleData));
    const confirm = vi.fn(() => false);
    const { result } = renderHook(() => useSignatureState({ confirm }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith(REPLACE_PROMPT);
    expect(result.current.data.fullName).toBe('Jane');
    expect(result.current.templateId).toBe('minimal');
    expect(window.location.hash).toBe('');
  });

  it('replaces saved work when the user agrees', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify({ data: { fullName: 'Jane' }, templateId: 'minimal' }));
    history.replaceState(null, '', '/' + fragment(sampleData, 'elegant'));
    const { result } = renderHook(() => useSignatureState({ confirm: () => true }));
    expect(result.current.data.fullName).toBe('Alex Rivera');
    expect(result.current.templateId).toBe('elegant');
  });

  it('does not ask when the link matches what is already saved', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify({ data: sampleData, templateId: 'minimal' }));
    history.replaceState(null, '', '/' + fragment(sampleData));
    const confirm = vi.fn(() => false);
    renderHook(() => useSignatureState({ confirm }));
    expect(confirm).not.toHaveBeenCalled();
  });

  it('applies a link pasted into an open tab', () => {
    const confirm = vi.fn(() => true);
    const { result } = renderHook(() => useSignatureState({ confirm }));
    act(() => result.current.setData({ ...defaultData, fullName: 'Draft' }));

    act(() => pasteLink(fragment(sampleData, 'elegant')));

    expect(confirm).toHaveBeenCalledWith(REPLACE_PROMPT);
    expect(result.current.data.fullName).toBe('Alex Rivera');
    expect(result.current.templateId).toBe('elegant');
    expect(window.location.hash).toBe('');
  });

  it('keeps the draft when a pasted link is declined', () => {
    const { result } = renderHook(() => useSignatureState({ confirm: () => false }));
    act(() => result.current.setData({ ...defaultData, fullName: 'Draft' }));
    act(() => pasteLink(fragment(sampleData)));
    expect(result.current.data.fullName).toBe('Draft');
    expect(window.location.hash).toBe('');
  });
});
