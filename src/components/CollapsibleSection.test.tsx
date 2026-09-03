// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import CollapsibleSection from './CollapsibleSection';

afterEach(cleanup);

function renderSection(open: boolean) {
  return render(
    <CollapsibleSection title="Contact" subtitle="How people reach you" open={open} onToggle={() => {}}>
      <input aria-label="Phone" />
    </CollapsibleSection>,
  );
}

describe('CollapsibleSection', () => {
  it('exposes the toggle as a heading with expanded state', () => {
    renderSection(false);
    const heading = screen.getByRole('heading', { level: 2 });
    const button = screen.getByRole('button', { name: /Contact/ });
    expect(heading.contains(button)).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe(screen.getByLabelText('Phone').closest('[id]')?.id);
  });

  it('makes a collapsed section inert so its inputs leave the tab order', () => {
    renderSection(false);
    const panel = document.getElementById(screen.getByRole('button').getAttribute('aria-controls')!)!;
    expect(panel.hasAttribute('inert')).toBe(true);
  });

  it('lifts inert when open', () => {
    renderSection(true);
    const panel = document.getElementById(screen.getByRole('button').getAttribute('aria-controls')!)!;
    expect(panel.hasAttribute('inert')).toBe(false);
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true');
  });
});
