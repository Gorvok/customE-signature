// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import ContrastNote from './ContrastNote';

afterEach(cleanup);

describe('ContrastNote', () => {
  it('reports a readable pair with its ratio', () => {
    render(<ContrastNote primary="#0f172a" secondary="#f8fafc" />);
    const note = screen.getByRole('status');
    expect(note.textContent).toContain('17.');
    expect(note.textContent).toContain('clears WCAG AA');
  });

  it('warns about a pair that cannot be read', () => {
    render(<ContrastNote primary="#777777" secondary="#888888" />);
    const note = screen.getByRole('status');
    expect(note.textContent).toContain('1.2');
    expect(note.textContent).toContain('hard to read');
  });

  it('says nothing while the hex field holds something unparseable', () => {
    // The text input accepts partial input as it is typed.
    render(<ContrastNote primary="#01" secondary="#ffffff" />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('is announced, so the warning reaches a screen reader as colors change', () => {
    render(<ContrastNote primary="#000000" secondary="#ffffff" />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
});
