// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import SignatureFrame from './SignatureFrame';

describe('SignatureFrame', () => {
  afterEach(cleanup);

  it('renders the HTML inside an iframe whose sandbox never allows scripts', () => {
    const hostile = '<b>Hi</b><img src="x" onerror="alert(1)"><script>alert(2)</script>';
    const { container } = render(<SignatureFrame html={hostile} title="Signature preview" />);
    const frame = container.querySelector('iframe');
    expect(frame).not.toBeNull();
    expect(frame!.getAttribute('sandbox')).toBe('allow-same-origin');
    expect(frame!.getAttribute('sandbox')).not.toContain('allow-scripts');
    expect(frame!.getAttribute('srcdoc')).toContain(hostile);
    expect(frame!.getAttribute('title')).toBe('Signature preview');
    // The page's own DOM never receives the markup.
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });

  it('is focusable and exposed to assistive tech by default', () => {
    const { container } = render(<SignatureFrame html="<i>x</i>" title="Preview" />);
    const frame = container.querySelector('iframe')!;
    expect(frame.hasAttribute('tabindex')).toBe(false);
    expect(frame.hasAttribute('aria-hidden')).toBe(false);
  });

  it('leaves the tab order and accessibility tree when decorative', () => {
    const { container } = render(<SignatureFrame html="<i>x</i>" title="Thumbnail" decorative />);
    const frame = container.querySelector('iframe')!;
    expect(frame.getAttribute('tabindex')).toBe('-1');
    expect(frame.getAttribute('aria-hidden')).toBe('true');
  });

  it('paints the requested background inside the frame, not on the page', () => {
    const { container } = render(<SignatureFrame html="<i>x</i>" title="Preview" background="#1a1a1a" />);
    const frame = container.querySelector('iframe')!;
    expect(frame.getAttribute('srcdoc')).toContain('background:#1a1a1a');
  });
});
