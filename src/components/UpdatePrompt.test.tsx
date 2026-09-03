// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

const updateServiceWorker = vi.fn(async () => {});
let initialNeedRefresh = false;

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => {
    const needRefresh = useState(initialNeedRefresh);
    const offlineReady = useState(false);
    return { needRefresh, offlineReady, updateServiceWorker };
  },
}));

const { default: UpdatePrompt } = await import('./UpdatePrompt');

afterEach(() => {
  cleanup();
  updateServiceWorker.mockClear();
});

describe('UpdatePrompt', () => {
  it('renders nothing while the current version is the latest', () => {
    initialNeedRefresh = false;
    render(<UpdatePrompt />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('offers a reload when a new version is waiting, and can be dismissed', () => {
    initialNeedRefresh = true;
    render(<UpdatePrompt />);
    expect(screen.getByRole('status').textContent).toContain('A new version is available');

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
