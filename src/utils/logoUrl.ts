/**
 * Help for the hosted-logo path.
 *
 * Telling someone to "paste a public image URL" moves the problem rather than
 * solving it: the links people have to hand are share *pages*, not images. A
 * Drive or Dropbox share link renders nothing in an `<img>`, and the failure
 * looks identical to a typo.
 */

export type LogoUrlLevel = 'ok' | 'caution' | 'problem';

export interface LogoUrlAdvice {
  level: LogoUrlLevel;
  /** What is wrong, or undefined when the URL looks usable. */
  problem?: string;
  /** A direct-image URL to offer in its place, when one can be derived. */
  suggestion?: string;
}

const OK: LogoUrlAdvice = { level: 'ok' };

const IMAGE_EXTENSION = /\.(?:png|jpe?g|gif|webp|avif|bmp|ico)(?:[?#]|$)/i;

/** `/file/d/<id>/view` and `open?id=<id>` both identify a Drive file. */
const DRIVE_ID = [/\/file\/d\/([A-Za-z0-9_-]{10,})/, /[?&]id=([A-Za-z0-9_-]{10,})/];

export function adviseLogoUrl(raw: string): LogoUrlAdvice {
  const url = raw.trim();
  // Empty, or an upload: both are handled elsewhere.
  if (!url || url.toLowerCase().startsWith('data:')) return OK;

  if (/^http:\/\//i.test(url)) {
    return {
      level: 'problem',
      problem: 'Mail clients block images served over http. Use an https link.',
      suggestion: url.replace(/^http:\/\//i, 'https://'),
    };
  }

  if (!/^https:\/\//i.test(url)) {
    return { level: 'caution', problem: 'This does not look like a web address. A logo must be a public https link.' };
  }

  let host: string;
  let path: string;
  try {
    const parsed = new URL(url);
    host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    path = parsed.pathname;
  } catch {
    return { level: 'caution', problem: 'This does not look like a web address.' };
  }

  // Google Drive: a share link opens a viewer page, not the file.
  if (host === 'drive.google.com') {
    const id = DRIVE_ID.map((re) => re.exec(url)?.[1]).find(Boolean);
    if (path.startsWith('/uc')) return OK;
    return {
      level: 'problem',
      problem: 'A Google Drive share link opens a preview page, so no image loads.',
      ...(id ? { suggestion: `https://drive.google.com/uc?export=view&id=${id}` } : {}),
    };
  }

  // Dropbox: the documented direct form is raw=1.
  if (host === 'dropbox.com' || host.endsWith('.dropbox.com')) {
    if (/[?&]raw=1(?:&|$)/.test(url)) return OK;
    const direct = new URL(url);
    direct.searchParams.delete('dl');
    direct.searchParams.set('raw', '1');
    return {
      level: 'problem',
      problem: 'A Dropbox share link returns a preview page, so no image loads.',
      suggestion: direct.toString(),
    };
  }

  // OneDrive share links have no dependable direct-image form.
  if (host === '1drv.ms' || host.endsWith('onedrive.live.com') || host.endsWith('sharepoint.com')) {
    return {
      level: 'problem',
      problem: 'OneDrive share links cannot be used as images. Host the logo somewhere that serves the file directly.',
    };
  }

  // A link to a page on an image host, rather than to the image itself.
  if ((host === 'imgur.com' || host === 'flickr.com' || host === 'postimg.cc') && !IMAGE_EXTENSION.test(url)) {
    return {
      level: 'problem',
      problem: `This is a page on ${host}, not the image. Open the image itself and copy its direct link.`,
    };
  }

  if (IMAGE_EXTENSION.test(url)) return OK;

  return {
    level: 'caution',
    problem: 'This may not be a direct image link. It should end in .png, .jpg or similar, or be served by an image host.',
  };
}
