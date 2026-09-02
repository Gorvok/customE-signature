import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  /** Signature HTML produced by a template (already escaped). */
  html: string;
  /** Accessible name for the frame. */
  title: string;
  /** Background of the frame's document; transparent lets the parent paint it. */
  background?: string;
  /** Thumbnails: removed from the tab order and the accessibility tree. */
  decorative?: boolean;
}

/**
 * Renders generated signature HTML inside a sandboxed iframe.
 *
 * The sandbox grants `allow-same-origin`, so this component can measure the
 * document's height and the frame inherits the page's CSP, but it does not
 * grant `allow-scripts`. Any <script> tag or inline event handler that
 * reached the HTML is therefore inert, even if the config validation upstream
 * were bypassed, and styles inside the frame cannot touch the page.
 */
export default function SignatureFrame({ html, title, background = 'transparent', decorative = false }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(0);

  const srcDoc = useMemo(
    () =>
      `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:${background}}</style></head><body>${html}</body></html>`,
    [html, background],
  );

  // Size the frame to its content, and keep following it as images load.
  const handleLoad = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (!doc) return;
    const update = () => setHeight(doc.documentElement.scrollHeight);
    update();
    observerRef.current?.disconnect();
    if (typeof ResizeObserver !== 'undefined' && doc.body) {
      observerRef.current = new ResizeObserver(update);
      observerRef.current.observe(doc.body);
    }
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return (
    <iframe
      ref={ref}
      title={title}
      sandbox="allow-same-origin"
      srcDoc={srcDoc}
      onLoad={handleLoad}
      tabIndex={decorative ? -1 : undefined}
      aria-hidden={decorative || undefined}
      style={{ display: 'block', width: '100%', height, border: 0 }}
    />
  );
}
