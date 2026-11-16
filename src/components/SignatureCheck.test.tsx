// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import SignatureCheck from './SignatureCheck';
import { templates } from '../templates';
import { sampleData } from '../data/sampleData';

afterEach(cleanup);

/** The panel itself; the collapsing section around it belongs to LazySection. */
function open() {
  render(<SignatureCheck />);
  return screen.getByLabelText('Signature HTML');
}

describe('SignatureCheck', () => {
  it('says nothing until something is pasted', () => {
    open();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('asks for markup when given the text a signature shows', () => {
    const box = open();
    fireEvent.change(box, { target: { value: 'Alex Rivera, Head of Product' } });
    expect(screen.getByText(/does not look like HTML/)).toBeTruthy();
  });

  it('passes a signature this app generated', () => {
    const box = open();
    fireEvent.change(box, { target: { value: templates[0].render(sampleData) } });
    expect(screen.getByRole('status').textContent).toContain('no problems found');
  });

  it('names what is wrong with one that would break', () => {
    const box = open();
    fireEvent.change(box, {
      target: { value: '<div class="sig" style="display: flex; color: #666;">Alex</div>' },
    });
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('problems found');
    // The rule that matters most: classes are useless once the stylesheet goes.
    expect(status.textContent).toMatch(/Classes are useless/);
    expect(status.textContent).toMatch(/flex/);
  });

  it('shows the pasted signature in the sandboxed frame, never in the page', () => {
    const box = open();
    fireEvent.change(box, { target: { value: '<b>Alex</b><script>alert(1)</script>' } });
    const frame = document.querySelector('iframe');
    expect(frame?.getAttribute('sandbox')).toBe('allow-same-origin');
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('b')).toBeNull();
  });
});
