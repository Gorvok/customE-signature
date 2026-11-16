// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { AT_CAPACITY, FIRST_SIGNATURE_NAME, useSignatureState } from './useSignatureState';
import { defaultData } from '../data/defaults';
import { MAX_SIGNATURES } from '../data/options';
import { LEGACY_SIGNATURE_STORAGE_KEY, LIBRARY_STORAGE_KEY, SIGNATURE_STORAGE_KEY } from '../data/storage';

const library = () =>
  JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY) ?? '{}') as {
    activeId?: string;
    items?: { id: string; name: string; data: { fullName?: string }; templateId: string }[];
  };

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  history.replaceState(null, '', '/');
});

describe('the signature library', () => {
  it('starts as one named signature', () => {
    const { result } = renderHook(() => useSignatureState());
    expect(result.current.signatures.items).toHaveLength(1);
    expect(result.current.signatures.items[0]!.name).toBe(FIRST_SIGNATURE_NAME);
    expect(result.current.signatures.activeId).toBe(result.current.signatures.items[0]!.id);
  });

  it('migrates a single saved signature into the library and retires the old key', () => {
    localStorage.setItem(
      SIGNATURE_STORAGE_KEY,
      JSON.stringify({ data: { fullName: 'Jane' }, templateId: 'elegant' }),
    );
    const { result } = renderHook(() => useSignatureState());

    expect(result.current.data.fullName).toBe('Jane');
    expect(result.current.templateId).toBe('elegant');
    expect(result.current.signatures.items).toHaveLength(1);
    expect(localStorage.getItem(SIGNATURE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_SIGNATURE_STORAGE_KEY)).toBeNull();
    expect(library().items?.[0]?.data.fullName).toBe('Jane');
  });

  it('adds a signature, switches to it, and keeps the first one untouched', () => {
    const { result } = renderHook(() => useSignatureState());
    act(() => {
      result.current.setData({ ...defaultData, fullName: 'First' });
    });
    const firstId = result.current.signatures.activeId;

    act(() => {
      expect(result.current.signatures.create()).toBeNull();
    });
    expect(result.current.signatures.items).toHaveLength(2);
    expect(result.current.signatures.activeId).not.toBe(firstId);
    expect(result.current.data).toEqual(defaultData);

    act(() => {
      result.current.setData({ ...defaultData, fullName: 'Second' });
    });
    const names = result.current.signatures.items.map((i) => i.data.fullName);
    expect(names).toEqual(['First', 'Second']);
  });

  it('switches back to an earlier signature with its own template', () => {
    const { result } = renderHook(() => useSignatureState());
    act(() => {
      result.current.setData({ ...defaultData, fullName: 'First' });
      result.current.setTemplateId('elegant');
    });
    const firstId = result.current.signatures.activeId;

    act(() => void result.current.signatures.create());
    act(() => {
      result.current.setTemplateId('minimal');
    });

    act(() => {
      result.current.signatures.select(firstId);
    });
    expect(result.current.data.fullName).toBe('First');
    expect(result.current.templateId).toBe('elegant');
  });

  it('ignores a selection that names no signature', () => {
    const { result } = renderHook(() => useSignatureState());
    const before = result.current.signatures.activeId;
    act(() => {
      result.current.signatures.select('nope');
    });
    expect(result.current.signatures.activeId).toBe(before);
  });

  it('duplicates a signature, copying its content under a distinct name', () => {
    const { result } = renderHook(() => useSignatureState());
    act(() => {
      result.current.setData({ ...defaultData, fullName: 'Original' });
      result.current.setTemplateId('corporate');
    });
    const sourceId = result.current.signatures.activeId;

    act(() => {
      expect(result.current.signatures.duplicate(sourceId)).toBeNull();
    });

    expect(result.current.signatures.items).toHaveLength(2);
    expect(result.current.data.fullName).toBe('Original');
    expect(result.current.templateId).toBe('corporate');
    const names = result.current.signatures.items.map((i) => i.name);
    expect(new Set(names).size).toBe(2);
    expect(names[1]).toContain('copy');
  });

  it('renames, trimming and keeping names distinct', () => {
    const { result } = renderHook(() => useSignatureState());
    act(() => void result.current.signatures.create());
    const [first, second] = result.current.signatures.items;

    act(() => {
      result.current.signatures.rename(first!.id, '  Work  ');
    });
    expect(result.current.signatures.items[0]!.name).toBe('Work');

    // A name already taken is kept distinct rather than silently colliding.
    act(() => {
      result.current.signatures.rename(second!.id, 'Work');
    });
    expect(result.current.signatures.items[1]!.name).not.toBe('Work');
    expect(result.current.signatures.items[1]!.name).toContain('Work');
  });

  it('refuses an empty rename', () => {
    const { result } = renderHook(() => useSignatureState());
    const before = result.current.signatures.items[0]!.name;
    act(() => {
      result.current.signatures.rename(result.current.signatures.activeId, '   ');
    });
    expect(result.current.signatures.items[0]!.name).toBe(before);
  });

  it('deletes a signature and moves the selection off it', () => {
    const { result } = renderHook(() => useSignatureState());
    act(() => {
      result.current.setData({ ...defaultData, fullName: 'Keep' });
    });
    const keepId = result.current.signatures.activeId;
    act(() => void result.current.signatures.create());
    const doomedId = result.current.signatures.activeId;

    act(() => {
      result.current.signatures.remove(doomedId);
    });
    expect(result.current.signatures.items).toHaveLength(1);
    expect(result.current.signatures.activeId).toBe(keepId);
    expect(result.current.data.fullName).toBe('Keep');
  });

  it('never empties the library: removing the last one leaves a blank', () => {
    const { result } = renderHook(() => useSignatureState());
    act(() => {
      result.current.setData({ ...defaultData, fullName: 'Only' });
    });

    act(() => {
      result.current.signatures.remove(result.current.signatures.activeId);
    });
    expect(result.current.signatures.items).toHaveLength(1);
    expect(result.current.data).toEqual(defaultData);
  });

  it('stops at the cap and says why, instead of failing quietly', () => {
    const { result } = renderHook(() => useSignatureState());
    for (let n = 1; n < MAX_SIGNATURES; n++) {
      act(() => {
        expect(result.current.signatures.create()).toBeNull();
      });
    }
    expect(result.current.signatures.items).toHaveLength(MAX_SIGNATURES);

    act(() => {
      expect(result.current.signatures.create()).toBe(AT_CAPACITY);
    });
    act(() => {
      expect(result.current.signatures.duplicate(result.current.signatures.activeId)).toBe(AT_CAPACITY);
    });
    expect(result.current.signatures.items).toHaveLength(MAX_SIGNATURES);
  });

  it('restores the whole library, and the active one, on the next load', () => {
    const first = renderHook(() => useSignatureState());
    act(() => {
      first.result.current.setData({ ...defaultData, fullName: 'One' });
    });
    act(() => void first.result.current.signatures.create());
    act(() => {
      first.result.current.setData({ ...defaultData, fullName: 'Two' });
      first.result.current.signatures.rename(first.result.current.signatures.activeId, 'Second');
    });
    const activeId = first.result.current.signatures.activeId;
    cleanup();

    const next = renderHook(() => useSignatureState());
    expect(next.result.current.signatures.items.map((i) => i.data.fullName)).toEqual(['One', 'Two']);
    expect(next.result.current.signatures.activeId).toBe(activeId);
    expect(next.result.current.data.fullName).toBe('Two');
  });
});
