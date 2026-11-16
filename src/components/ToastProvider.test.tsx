// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ToastProvider from './ToastProvider';
import { useToast, type ToastAction } from '../toast';

afterEach(cleanup);

/** A button that raises one toast, so the provider can be driven from a test. */
function Raise({ message, action }: { message: string; action?: ToastAction }) {
  const { addToast } = useToast();
  return (
    <button type="button" onClick={() => addToast(message, 'info', action)}>
      raise
    </button>
  );
}

function renderWithToast(props: { message: string; action?: ToastAction }) {
  render(
    <ToastProvider>
      <Raise {...props} />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'raise' }));
}

describe('ToastProvider', () => {
  it('announces the message in a live region', () => {
    renderWithToast({ message: 'Cleared all fields' });
    expect(screen.getByRole('status').textContent).toContain('Cleared all fields');
  });

  it('offers an action when one is given, and runs it', () => {
    const onClick = vi.fn();
    renderWithToast({ message: 'Cleared all fields', action: { label: 'Undo', onClick } });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('dismisses itself once the action is taken', () => {
    renderWithToast({ message: 'Cleared all fields', action: { label: 'Undo', onClick: vi.fn() } });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.queryByText('Cleared all fields')).toBeNull();
  });

  it('shows no action button when there is nothing to offer', () => {
    renderWithToast({ message: 'Downloaded signature HTML' });
    // Only the dismiss button.
    expect(screen.getAllByRole('button').filter((b) => b.textContent?.trim())).toHaveLength(1);
  });

  it('can be dismissed by hand', () => {
    renderWithToast({ message: 'Downloaded signature HTML' });
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Downloaded signature HTML')).toBeNull();
  });
});
