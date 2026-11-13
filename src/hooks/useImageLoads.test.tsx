// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useImageLoads } from './useImageLoads';

/**
 * jsdom never fetches images, so the probe is driven by a stand-in that records
 * each instance and lets a test decide when (and whether) it loads.
 */
class FakeImage {
  static instances: FakeImage[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  #src = '';
  constructor() {
    FakeImage.instances.push(this);
  }
  set src(value: string) {
    this.#src = value;
  }
  get src() {
    return this.#src;
  }
  succeed() {
    act(() => this.onload?.());
  }
  fail() {
    act(() => this.onerror?.());
  }
}

function Probe({ url }: { url: string }) {
  return <output>{useImageLoads(url, { delay: 10 })}</output>;
}

const state = () => screen.getByRole('status').textContent;

afterEach(() => {
  cleanup();
  FakeImage.instances = [];
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function withFakeImage() {
  vi.stubGlobal('Image', FakeImage);
}

describe('useImageLoads', () => {
  it('stays idle for anything that is not an http(s) URL', () => {
    withFakeImage();
    for (const url of ['', '   ', 'data:image/png;base64,AAAA', 'not-a-url']) {
      const { unmount } = render(<Probe url={url} />);
      expect(state(), url).toBe('idle');
      unmount();
    }
    expect(FakeImage.instances).toHaveLength(0);
  });

  it('reports loaded once the image resolves', () => {
    withFakeImage();
    vi.useFakeTimers();
    render(<Probe url="https://example.com/logo.png" />);
    expect(state()).toBe('loading');

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(FakeImage.instances).toHaveLength(1);
    expect(FakeImage.instances[0]!.src).toBe('https://example.com/logo.png');

    FakeImage.instances[0]!.succeed();
    expect(state()).toBe('loaded');
  });

  it('reports failed when the image cannot be decoded', () => {
    withFakeImage();
    vi.useFakeTimers();
    render(<Probe url="https://example.com/missing.png" />);
    act(() => {
      vi.advanceTimersByTime(20);
    });
    FakeImage.instances[0]!.fail();
    expect(state()).toBe('failed');
  });

  it('waits for typing to settle instead of probing every keystroke', () => {
    withFakeImage();
    vi.useFakeTimers();
    const { rerender } = render(<Probe url="https://example.com/a.png" />);
    rerender(<Probe url="https://example.com/ab.png" />);
    rerender(<Probe url="https://example.com/abc.png" />);
    expect(FakeImage.instances).toHaveLength(0);

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(FakeImage.instances).toHaveLength(1);
    expect(FakeImage.instances[0]!.src).toBe('https://example.com/abc.png');
  });

  it('ignores a late result that belongs to an earlier URL', () => {
    withFakeImage();
    vi.useFakeTimers();
    const { rerender } = render(<Probe url="https://example.com/first.png" />);
    act(() => {
      vi.advanceTimersByTime(20);
    });
    const first = FakeImage.instances[0]!;

    rerender(<Probe url="https://example.com/second.png" />);
    act(() => {
      vi.advanceTimersByTime(20);
    });

    // The stale probe answers after the URL moved on; it must not be shown.
    first.succeed();
    expect(state()).toBe('loading');

    FakeImage.instances[1]!.succeed();
    expect(state()).toBe('loaded');
  });
});
