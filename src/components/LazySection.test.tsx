// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import LazySection from './LazySection';

afterEach(cleanup);

function renderSection() {
  render(
    <LazySection id="sec-x" title="Team mode" subtitle="One per person" icon={null}>
      <p>panel body</p>
    </LazySection>,
  );
  return screen.getByRole('button', { name: /Team mode/ });
}

describe('LazySection', () => {
  it('does not render its panel until the section is opened', () => {
    const toggle = renderSection();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // Not merely hidden: nothing of the panel exists, so its code is not
    // needed on a visit that never opens it.
    expect(screen.queryByText('panel body')).toBeNull();
  });

  it('renders the panel when opened', () => {
    const toggle = renderSection();
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('panel body')).toBeTruthy();
  });

  it('keeps the panel once opened, so closing it loses nothing typed in', () => {
    const toggle = renderSection();
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('panel body')).toBeTruthy();
  });
});
