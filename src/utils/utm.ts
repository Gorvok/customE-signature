import type { SignatureData } from '../types';

/** The campaign settings carried in a signature. */
export type UtmSettings = Pick<SignatureData, 'utmEnabled' | 'utmSource' | 'utmMedium' | 'utmCampaign'>;

/** Parameters are added in this order, and only when they have a value. */
const PARAMS = [
  ['utm_source', 'utmSource'],
  ['utm_medium', 'utmMedium'],
  ['utm_campaign', 'utmCampaign'],
] as const;

/**
 * Tag a link so clicks from the signature can be attributed.
 *
 * Only http(s) links are touched: mailto: and tel: have no query string, and
 * social profiles are left alone deliberately — rewriting the URLs people
 * recognise makes a signature look spammy on hover.
 *
 * A parameter the author already put in the link wins, so a hand-tagged
 * campaign is never overwritten. Anything unparseable is returned untouched
 * rather than mangled.
 */
export function withUtm(url: string, settings: UtmSettings): string {
  if (!settings.utmEnabled) return url;
  const trimmed = url.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return url;

  const values = PARAMS.map(([param, field]) => [param, settings[field].trim()] as const).filter(
    ([, value]) => value,
  );
  if (!values.length) return url;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return url;
  }
  for (const [param, value] of values) {
    if (!parsed.searchParams.has(param)) parsed.searchParams.set(param, value);
  }
  return parsed.toString();
}
