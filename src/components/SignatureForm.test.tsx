// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import SignatureForm from './SignatureForm';
import ToastProvider from './ToastProvider';
import { sampleData } from '../data/sampleData';
import type { SignatureData } from '../types';

beforeAll(() => {
  // jsdom has no layout, so neither of these exists there.
  Element.prototype.scrollIntoView = vi.fn();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }),
  });
});

afterEach(cleanup);

/** A stateful host, so moves and edits actually re-render the form. */
function Host({ initial }: { initial: SignatureData }) {
  const [data, setData] = useState(initial);
  return (
    <ToastProvider>
      <SignatureForm data={data} onChange={setData} />
    </ToastProvider>
  );
}

describe('SignatureForm keyboard reordering', () => {
  it('keeps focus on the moved row when the pressed arrow becomes disabled', async () => {
    const user = userEvent.setup();
    render(<Host initial={sampleData} />);
    await user.click(screen.getByRole('button', { name: /Social Links/, expanded: false }));

    // Default order: Website, Instagram, LinkedIn, ... so LinkedIn starts at index 2.
    const up = () => screen.getByRole('button', { name: 'Move LinkedIn up' });
    const down = () => screen.getByRole('button', { name: 'Move LinkedIn down' });

    await user.click(up());
    expect(document.activeElement).toBe(up());

    await user.click(up());
    expect((up() as HTMLButtonElement).disabled).toBe(true);
    expect(document.activeElement).toBe(down());
  });

  it('attaches drag data so Firefox starts the drag', async () => {
    const user = userEvent.setup();
    render(<Host initial={sampleData} />);
    await user.click(screen.getByRole('button', { name: /Social Links/, expanded: false }));
    const [handle] = screen.getAllByTitle('Drag to reorder');
    if (!handle) throw new Error('no drag handle rendered');
    const setData = vi.fn();
    fireEvent.dragStart(handle, { dataTransfer: { setData, effectAllowed: '' } });
    expect(setData).toHaveBeenCalledWith('text/plain', '0');
  });
});

describe('SignatureForm logo uploader', () => {
  it('is a real button that opens the file picker from the keyboard', async () => {
    const user = userEvent.setup();
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(<Host initial={sampleData} />);
    // The quick-jump nav also has a "Branding" button; the toggle is the one with an expanded state.
    await user.click(screen.getByRole('button', { name: /Branding/, expanded: false }));

    const upload = screen.getByRole('button', { name: 'Upload a logo' });
    upload.focus();
    await user.keyboard('{Enter}');
    expect(click).toHaveBeenCalledTimes(1);

    expect(screen.getByLabelText('Or paste an image URL')).toBeTruthy();
    click.mockRestore();
  });
});
