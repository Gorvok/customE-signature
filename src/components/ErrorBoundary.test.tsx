// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import { SIGNATURE_STORAGE_KEY, THEME_STORAGE_KEY } from '../data/storage';

function Boom(): never {
  throw new Error('template exploded');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs the caught error; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('all good')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the recovery panel with the error message when a child throws', () => {
    render(
      <ErrorBoundary onReload={() => {}}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('template exploded')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeTruthy();
  });

  it('reloads without touching saved data', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, '{"fullName":"x"}');
    const onReload = vi.fn();
    render(
      <ErrorBoundary onReload={onReload}>
        <Boom />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(SIGNATURE_STORAGE_KEY)).toBe('{"fullName":"x"}');
  });

  it('clears every app storage key and reloads on request', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, '{"fullName":"x"}');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    localStorage.setItem('unrelated', 'kept');
    const onReload = vi.fn();
    render(
      <ErrorBoundary onReload={onReload}>
        <Boom />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByRole('button', { name: /clear saved data/i }));
    expect(localStorage.getItem(SIGNATURE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('kept');
    expect(onReload).toHaveBeenCalledTimes(1);
  });
});
