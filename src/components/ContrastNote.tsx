import { AA_CONTRAST, contrastRatio, formatContrast } from '../utils/color';

interface Props {
  primary: string;
  secondary: string;
}

/**
 * How the two chosen colors read against each other.
 *
 * Templates put one on the other — Classic Dark sets the secondary as text on
 * a primary box, Bold Banner does the same in its banner — so a pair with too
 * little contrast produces a signature nobody can read, in any client and in
 * any mode. The export panel reports it once a signature exists; this says it
 * while the colors are being picked, which is when it can be acted on.
 */
export default function ContrastNote({ primary, secondary }: Props) {
  const ratio = contrastRatio(primary, secondary);
  // Mid-edit the hex field may hold something unparseable; say nothing rather
  // than guess.
  if (ratio === null) return null;
  const passes = ratio >= AA_CONTRAST;

  return (
    <p
      role="status"
      className={`rounded-lg border px-3 py-2 text-xs ${
        passes
          ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300'
          : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
      }`}
    >
      Primary on secondary: <strong>{formatContrast(ratio)}</strong>{' '}
      {passes
        ? '— clears WCAG AA, so text in one color on the other is readable.'
        : `— below the ${AA_CONTRAST}:1 WCAG AA asks for. Templates that put one color on the other will be hard to read.`}
    </p>
  );
}
