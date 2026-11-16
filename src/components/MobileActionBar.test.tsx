// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MobileActionBar from './MobileActionBar';
import ToastProvider from './ToastProvider';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'clipboard');
});

const HTML = '<table><tr><td>Alex Rivera</td></tr></table>';

function renderBar(onShowPreview = vi.fn()) {
  render(
    <ToastProvider>
      <MobileActionBar html={HTML} onShowPreview={onShowPreview} />
    </ToastProvider>,
  );
  return onShowPreview;
}

function stubClipboard(write: () => Promise<void>, writeText: () => Promise<void>) {
  vi.stubGlobal('ClipboardItem', class {});
  Object.defineProperty(navigator, 'clipboard', { value: { write, writeText }, configurable: true });
}

describe('MobileActionBar', () => {
  it('copies the signature and says so', async () => {
    const write = vi.fn(() => Promise.resolve());
    stubClipboard(write, vi.fn(() => Promise.resolve()));
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'Copy signature' }));

    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied!' })).toBeTruthy());
    expect(screen.getByRole('status').textContent).toContain('paste it into your email settings');
  });

  it('says what happened when only plain text could be written', async () => {
    stubClipboard(vi.fn(() => Promise.reject(new Error('denied'))), vi.fn(() => Promise.resolve()));
    renderBar();
    fireEvent.click(screen.getByRole('button', { name: 'Copy signature' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('pastes as code'));
  });

  it('points at the download when the clipboard refuses entirely', async () => {
    stubClipboard(vi.fn(() => Promise.reject(new Error('denied'))), vi.fn(() => Promise.reject(new Error('denied'))));
    renderBar();
    fireEvent.click(screen.getByRole('button', { name: 'Copy signature' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Copy failed'));
    // And it does not pretend the copy worked.
    expect(screen.queryByRole('button', { name: 'Copied!' })).toBeNull();
  });

  it('downloads the signature as a file', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:stub', revokeObjectURL: () => {} });
    renderBar();
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('can switch the view to the preview, so the result can be looked at', () => {
    const onShowPreview = renderBar();
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(onShowPreview).toHaveBeenCalled();
  });
});
