// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { ThemeProvider } from './ThemeContext';
import ToastProvider from './components/ToastProvider';
import { encodeConfig } from './utils/shareConfig';
import { sampleData } from './data/sampleData';
import { SIGNATURE_STORAGE_KEY } from './data/storage';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }),
  });
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  history.replaceState(null, '', '/');
});

function renderApp() {
  render(
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>,
  );
}

/** Saved work in this browser, and a link carrying somebody else's signature. */
function savedWorkAndIncomingLink() {
  localStorage.setItem(
    SIGNATURE_STORAGE_KEY,
    JSON.stringify({ data: { ...sampleData, fullName: 'Jane Doe' }, templateId: 'minimal' }),
  );
  history.replaceState(null, '', `/#cfg=${encodeConfig({ data: sampleData, templateId: 'elegant' })}`);
}

describe('a share link that would replace saved work', () => {
  it('asks on the page rather than in a browser dialog', () => {
    savedWorkAndIncomingLink();
    renderApp();

    const prompt = screen.getByRole('alertdialog');
    expect(prompt.textContent).toContain('Replace the one saved in this browser');
    // And it says whose signature the link holds, which a dialog could not.
    expect(prompt.textContent).toContain('Alex Rivera');
    // Nothing has been replaced while the question stands.
    expect(screen.getByLabelText('Full Name')).toHaveProperty('value', 'Jane Doe');
  });

  it('keeps the saved signature when the answer is to keep it', () => {
    savedWorkAndIncomingLink();
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Keep mine' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByLabelText('Full Name')).toHaveProperty('value', 'Jane Doe');
  });

  it('loads the linked signature when the answer is to replace', () => {
    savedWorkAndIncomingLink();
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Replace mine' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByLabelText('Full Name')).toHaveProperty('value', 'Alex Rivera');
  });

  it('does not ask when there is nothing to lose', () => {
    history.replaceState(null, '', `/#cfg=${encodeConfig({ data: sampleData, templateId: 'elegant' })}`);
    renderApp();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByLabelText('Full Name')).toHaveProperty('value', 'Alex Rivera');
  });
});

describe('resetting', () => {
  it('clears at once and offers the way back, instead of asking first', () => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify({ data: sampleData, templateId: 'minimal' }));
    renderApp();
    expect(screen.getByLabelText('Full Name')).toHaveProperty('value', 'Alex Rivera');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Full Name')).toHaveProperty('value', '');

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText('Full Name')).toHaveProperty('value', 'Alex Rivera');
  });
});
