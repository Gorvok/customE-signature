import { MARK_VARIANTS, markGeometry, type MarkVariant } from '../brand';

interface Props {
  /** Rendered width and height in px. */
  size?: number;
  variant?: MarkVariant;
  /**
   * The mark is decorative wherever the name is written beside it, which is
   * everywhere in this app — so it is hidden from assistive tech by default
   * rather than read out twice.
   */
  title?: string;
  className?: string;
}

/**
 * Envoi's mark: a signature block drawn as a letter, stamped into a seal.
 *
 * Drawn from the same geometry the favicon and app icons are generated from
 * (data/brandMark.json), so the header can never show a different mark from
 * the browser tab.
 */
export default function BrandMark({ size = 40, variant = 'dark', title, className }: Props) {
  const colors = MARK_VARIANTS[variant];
  const { seal, letter, cornerRadius, viewBox } = markGeometry;

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {colors.background && (
        <rect width="512" height="512" rx={cornerRadius} fill={colors.background} />
      )}
      <circle cx={seal.cx} cy={seal.cy} r={seal.r} fill={colors.seal} />
      {letter.map((bar) => (
        <rect
          key={bar.role}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          rx={bar.rx}
          fill={colors.letter}
        />
      ))}
    </svg>
  );
}
