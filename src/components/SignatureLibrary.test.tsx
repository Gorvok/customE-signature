// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import SignatureLibrary from './SignatureLibrary';
import ToastProvider from './ToastProvider';
import { defaultData } from '../data/defaults';
import type { SavedSignature } from '../types';

afterEach(cleanup);

const signature = (id: string, name: string): SavedSignature => ({
  id,
  name,
  data: defaultData,
  templateId: 'classic-dark',
});

function renderLibrary(items: SavedSignature[], overrides: Partial<Parameters<typeof SignatureLibrary>[0]> = {}) {
  const props = {
    items,
    activeId: items[0]!.id,
    onSelect: vi.fn(),
    onCreate: vi.fn(() => null),
    onDuplicate: vi.fn(() => null),
    onRename: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  };
  render(
    <ToastProvider>
      <SignatureLibrary {...props} />
    </ToastProvider>,
  );
  return props;
}

describe('SignatureLibrary with one signature', () => {
  it('stays a single line: there is nothing to switch between yet', () => {
    renderLibrary([signature('a', 'My signature')]);
    expect(screen.getByRole('heading', { name: 'My signature' })).toBeTruthy();
    // The management actions are not what a first visit is for.
    expect(screen.queryByRole('button', { name: 'Rename' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    expect(screen.queryByText(/of 10 in this browser/)).toBeNull();
  });

  it('still offers a second signature, which is the way out of the compact state', () => {
    const props = renderLibrary([signature('a', 'My signature')]);
    fireEvent.click(screen.getByRole('button', { name: '+ New signature' }));
    expect(props.onCreate).toHaveBeenCalled();
  });

  it('shows the full panel on request', () => {
    renderLibrary([signature('a', 'My signature')]);
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    expect(screen.getByRole('button', { name: 'Rename' })).toBeTruthy();
    expect(screen.getByText(/1 of 10 in this browser/)).toBeTruthy();
  });
});

describe('SignatureLibrary with several signatures', () => {
  const two = [signature('a', 'Work'), signature('b', 'Personal')];

  it('shows the full panel without being asked', () => {
    renderLibrary(two);
    expect(screen.getByRole('heading', { name: 'Saved signatures' })).toBeTruthy();
    expect(screen.getByText(/2 of 10 in this browser/)).toBeTruthy();
  });

  it('switches to the one that is clicked', () => {
    const props = renderLibrary(two);
    fireEvent.click(screen.getByRole('button', { name: 'Personal' }));
    expect(props.onSelect).toHaveBeenCalledWith('b');
  });

  it('marks the active entry for assistive tech', () => {
    renderLibrary(two);
    expect(screen.getByRole('button', { name: 'Work' }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('button', { name: 'Personal' }).hasAttribute('aria-current')).toBe(false);
  });

  it('deletes only after the confirmation is accepted', () => {
    const confirmDelete = vi.fn(() => false);
    const props = renderLibrary(two, { confirmDelete });
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    expect(confirmDelete).toHaveBeenCalled();
    expect(props.onRemove).not.toHaveBeenCalled();
  });
});
