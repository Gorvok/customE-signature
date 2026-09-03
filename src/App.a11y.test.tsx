// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import App from './App';
import { ThemeProvider } from './ThemeContext';
import ToastProvider from './components/ToastProvider';

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
});

/** Violations as readable strings, so a failure says what and where. */
async function violations(node: Element): Promise<string[]> {
  const results = await axe.run(node, {
    // jsdom has no layout, so contrast is computed by hand in index.css instead;
    // srcdoc frames never load in jsdom, so do not wait on them.
    rules: { 'color-contrast': { enabled: false } },
    iframes: false,
  });
  return results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`,
  );
}

function renderApp() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe('App accessibility', () => {
  it('has no axe violations with sample data loaded', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Load sample' }));
    expect(await violations(document.body)).toEqual([]);
  }, 30_000);

  it('has no axe violations with every form section open and a provider selected', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Load sample' }));
    for (const name of [/Social Links/, /Call to Action/, /Legal Disclaimer/, /Branding/]) {
      // The quick-jump nav shares some names; the section toggles are the buttons with an expanded state.
      fireEvent.click(screen.getByRole('button', { name, expanded: false }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Gmail' }));
    fireEvent.click(screen.getByRole('button', { name: /View HTML/ }));
    expect(await violations(document.body)).toEqual([]);
  }, 30_000);

  it('uses a single h1 and a continuous heading outline', () => {
    renderApp();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1], `heading jump at index ${i}`).toBeLessThanOrEqual(1);
    }
  });

  it('marks template cards and provider buttons as toggles', () => {
    renderApp();
    expect(screen.getByRole('button', { name: 'Minimal', pressed: false })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Classic Dark', pressed: true })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Gmail' }));
    expect(screen.getByRole('button', { name: 'Gmail', pressed: true })).toBeTruthy();
  });
});
