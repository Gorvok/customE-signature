import { useEffect, useState } from 'react';

export type ImageLoadState = 'idle' | 'loading' | 'loaded' | 'failed';

/**
 * Whether a remote image can actually be fetched and decoded.
 *
 * Loading an `<img>` is not subject to CORS, so this works against any host
 * without the page needing permission. The outcome is stored against the URL
 * it belongs to, so a slow probe for an earlier URL cannot be mistaken for
 * the current one — and so nothing is set synchronously during the effect.
 */
export function useImageLoads(url: string, { delay = 600 } = {}): ImageLoadState {
  const [result, setResult] = useState<{ url: string; ok: boolean } | null>(null);
  const probed = url.trim();
  const probeable = /^https?:\/\//i.test(probed);

  useEffect(() => {
    if (!probeable) return;
    // Let typing settle before touching the network.
    const timer = setTimeout(() => {
      const image = new Image();
      image.onload = () => setResult({ url: probed, ok: true });
      image.onerror = () => setResult({ url: probed, ok: false });
      image.src = probed;
    }, delay);
    return () => clearTimeout(timer);
  }, [probed, probeable, delay]);

  if (!probeable) return 'idle';
  if (result?.url !== probed) return 'loading';
  return result.ok ? 'loaded' : 'failed';
}
