import { useId } from 'react';
import type { ReactNode } from 'react';

interface Props {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Small status indicator shown on the right (e.g. a filled dot). */
  filled?: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export default function CollapsibleSection({ id, title, subtitle, icon, filled, open, onToggle, children }: Props) {
  const contentId = useId();
  return (
    <section
      id={id}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden scroll-mt-28"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        {icon && (
          <span className="flex-shrink-0 grid place-items-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
            {icon}
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900 dark:text-white">{title}</span>
            {filled && <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />}
          </span>
          {subtitle && <span className="block text-xs text-gray-500 dark:text-gray-500 truncate">{subtitle}</span>}
        </span>
        <svg
          className={`flex-shrink-0 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        id={contentId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </section>
  );
}
