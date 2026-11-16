/**
 * Will this signature survive a mail client in dark mode?
 *
 * A browser preview cannot answer that. Apple Mail, Outlook and Gmail all
 * paint their own background behind a message, and in dark mode that
 * background is close to black. Markup that declares a text color but no
 * background of its own inherits whatever the client paints — so dark gray
 * small print that reads perfectly in the preview can arrive as dark gray on
 * near-black.
 *
 * No single text color clears WCAG's 4.5:1 against both white and near-black
 * (the two requirements are arithmetically incompatible), so the only safe
 * answer is for the signature to paint its own background and pick text to
 * suit it. These checks enforce that: every run of visible text must sit on a
 * background the markup itself declares, and must be readable on it.
 *
 * Like `emailSafety.ts`, this is knowledge a test can enforce rather than a
 * comment to be remembered — and because the colors are the person's own
 * choice, the same checks run in the UI on the signature they are editing.
 */

import {
  AA_CONTRAST,
  AA_LARGE_CONTRAST,
  DARK_CLIENT_BG,
  LIGHT_CLIENT_BG,
  contrastRatio,
  formatContrast,
  meetsContrast,
} from './color';

export type DarkModeRule = 'text-on-client-background' | 'low-contrast';

export interface DarkModeIssue {
  rule: DarkModeRule;
  message: string;
  /** The text color at fault. */
  color: string;
  /** The background it was measured against, when the markup declares one. */
  background?: string;
  /** The offending text, trimmed for a readable test failure. */
  sample: string;
}

/** Elements that never wrap content, so they never change the inherited colors. */
const VOID_ELEMENTS = new Set([
  'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr',
]);

/**
 * Text at or above this size (px) is judged by WCAG's large-text threshold.
 * 18.66px is the large-text floor for bold text; 24px for normal weight.
 */
const LARGE_BOLD_PX = 18.66;
const LARGE_NORMAL_PX = 24;

interface Frame {
  tag: string;
  /** Declared text color, inherited from the nearest ancestor that set one. */
  color: string | null;
  /** Declared background, inherited the same way. null means "whatever the client paints". */
  background: string | null;
  fontSize: number | null;
  bold: boolean;
}

/**
 * `color:` in a style attribute, without matching `background-color:`. The
 * character before the property must not be a `-`, which is what separates
 * the two.
 */
const COLOR_DECL = /(?:^|[;{\s"'])color\s*:\s*([^;"'}]+)/i;
const BACKGROUND_COLOR_DECL = /background(?:-color)?\s*:\s*([^;"'}]+)/i;
const BGCOLOR_ATTR = /\bbgcolor\s*=\s*["']?([^"'\s>]+)/i;
const FONT_SIZE_DECL = /font-size\s*:\s*([\d.]+)px/i;
const FONT_WEIGHT_DECL = /font-weight\s*:\s*(bold|[6-9]00)/i;

const clean = (value: string) => value.trim().toLowerCase();

function declaredColor(attrs: string): string | null {
  const match = COLOR_DECL.exec(attrs);
  return match?.[1] ? clean(match[1]) : null;
}

function declaredBackground(attrs: string): string | null {
  const style = BACKGROUND_COLOR_DECL.exec(attrs);
  if (style?.[1]) return clean(style[1]);
  const attr = BGCOLOR_ATTR.exec(attrs);
  return attr?.[1] ? clean(attr[1]) : null;
}

/**
 * Comments are dropped whole. Outlook-only blocks (`<!--[if mso]>…`) go with
 * them, which is correct: their markup is seen by one client that has no dark
 * mode of this kind. The "downlevel revealed" markers are themselves complete
 * comments, so the content between them survives — which is what every other
 * client renders.
 */
const withoutComments = (html: string) => html.replace(/<!--[\s\S]*?-->/g, '');

const TAG = /<(\/?)([a-z][a-z0-9]*)\b([^>]*)>/gi;

/** `&nbsp;` and friends are spacing, not text a reader has to make out. */
const isBlank = (text: string) => !text.replace(/&nbsp;|&#160;|\s/g, '').trim();

const snippet = (text: string, length = 60) => text.replace(/\s+/g, ' ').trim().slice(0, length);

/** Minimum ratio for a run of text, by its size and weight. */
function requiredContrast(frame: Frame): number {
  const size = frame.fontSize;
  if (size === null) return AA_CONTRAST;
  if (size >= LARGE_NORMAL_PX || (frame.bold && size >= LARGE_BOLD_PX)) return AA_LARGE_CONTRAST;
  return AA_CONTRAST;
}

/**
 * Every run of visible text in `html`, with the colors in effect where it
 * sits. The parser only has to handle markup this app generates: well-formed
 * tags, double-quoted attributes and no `>` inside a value.
 */
function textRuns(html: string): { text: string; frame: Frame }[] {
  const source = withoutComments(html);
  const root: Frame = { tag: '#root', color: null, background: null, fontSize: null, bold: false };
  const stack: Frame[] = [root];
  const runs: { text: string; frame: Frame }[] = [];
  const top = () => stack[stack.length - 1]!;

  let cursor = 0;
  TAG.lastIndex = 0;
  for (let match = TAG.exec(source); match; match = TAG.exec(source)) {
    const text = source.slice(cursor, match.index);
    if (!isBlank(text)) runs.push({ text, frame: top() });
    cursor = match.index + match[0].length;

    const closing = match[1] === '/';
    const tag = match[2]!.toLowerCase();
    const attrs = match[3] ?? '';

    if (closing) {
      // Tolerate a stray close tag: unwind to the matching open one if there
      // is one, and otherwise ignore it rather than dropping the root.
      for (let index = stack.length - 1; index > 0; index--) {
        if (stack[index]!.tag === tag) {
          stack.length = index;
          break;
        }
      }
      continue;
    }
    if (VOID_ELEMENTS.has(tag) || attrs.trimEnd().endsWith('/')) continue;

    const parent = top();
    const size = FONT_SIZE_DECL.exec(attrs)?.[1];
    stack.push({
      tag,
      color: declaredColor(attrs) ?? parent.color,
      background: declaredBackground(attrs) ?? parent.background,
      fontSize: size ? Number(size) : parent.fontSize,
      bold: FONT_WEIGHT_DECL.test(attrs) || parent.bold,
    });
  }

  const tail = source.slice(cursor);
  if (!isBlank(tail)) runs.push({ text: tail, frame: top() });
  return runs;
}

/**
 * Readability problems in generated signature markup. Text that declares no
 * color of its own is left alone: the client picks that pair and keeps it
 * readable. Colors we cannot parse (a keyword, say) are skipped rather than
 * guessed at.
 */
export function findDarkModeIssues(html: string): DarkModeIssue[] {
  const issues: DarkModeIssue[] = [];
  const seen = new Set<string>();

  for (const { text, frame } of textRuns(html)) {
    const color = frame.color;
    if (!color) continue;
    const minimum = requiredContrast(frame);

    if (frame.background === null) {
      // Readable on both canvases would be fine — it is simply not achievable
      // at these thresholds, which is why painting a background is the fix.
      if (meetsContrast(color, LIGHT_CLIENT_BG, minimum) && meetsContrast(color, DARK_CLIENT_BG, minimum)) continue;
      const onDark = contrastRatio(color, DARK_CLIENT_BG);
      if (onDark === null) continue;
      const key = `text-on-client-background:${color}`;
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push({
        rule: 'text-on-client-background',
        color,
        message:
          `Text in ${color} declares no background of its own, so a dark-mode client paints one behind it ` +
          `(${formatContrast(onDark)} on ${DARK_CLIENT_BG}, needs ${minimum}:1). Give the element a background color.`,
        sample: snippet(text),
      });
      continue;
    }

    const ratio = contrastRatio(color, frame.background);
    if (ratio === null || ratio >= minimum) continue;
    const key = `low-contrast:${color}:${frame.background}`;
    if (seen.has(key)) continue;
    seen.add(key);
    issues.push({
      rule: 'low-contrast',
      color,
      background: frame.background,
      message:
        `Text in ${color} on ${frame.background} is ${formatContrast(ratio)}, below the ${minimum}:1 needed to be ` +
        'legible. Pick a lighter or darker pair.',
      sample: snippet(text),
    });
  }

  return issues;
}

/** One readable line per issue, for a test failure message. */
export function formatDarkModeIssues(issues: DarkModeIssue[]): string {
  return issues.map((i) => `  [${i.rule}] ${i.message}\n    at: ${i.sample}`).join('\n');
}

/**
 * Every background color the markup paints, deduplicated. Used to warn that a
 * dark surface is at the mercy of the clients that recolor content in dark
 * mode — which applies wherever the dark box is, not just on the outermost
 * element (bold-banner paints its banner cell, not its wrapper table).
 */
export function paintedBackgrounds(html: string): string[] {
  const found = new Set<string>();
  const source = withoutComments(html);
  TAG.lastIndex = 0;
  for (let match = TAG.exec(source); match; match = TAG.exec(source)) {
    if (match[1] === '/') continue;
    const background = declaredBackground(match[3] ?? '');
    if (background) found.add(background);
  }
  return [...found];
}
