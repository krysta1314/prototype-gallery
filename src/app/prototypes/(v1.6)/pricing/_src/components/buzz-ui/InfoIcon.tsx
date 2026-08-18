import type { ReactNode } from 'react';

interface InfoIconProps {
  /** Tooltip content — shown on hover and keyboard focus. */
  children: ReactNode;
  /** Accessible label for the icon button. */
  label?: string;
}

/**
 * Small inline (i) icon with a CSS-driven tooltip. Works on hover and
 * keyboard focus (focus-within on the wrapper handles tab navigation).
 */
export function InfoIcon({ children, label = 'More info' }: InfoIconProps) {
  return (
    <span className="relative inline-flex group align-middle">
      <button
        type="button"
        aria-label={label}
        className={
          'inline-flex items-center justify-center ' +
          'text-neutral-400 hover:text-neutral-700 focus:text-neutral-900 focus:outline-none ' +
          'transition-colors'
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
      <span
        role="tooltip"
        className={
          'pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 ' +
          'w-[240px] ' +
          'opacity-0 invisible ' +
          'group-hover:opacity-100 group-hover:visible ' +
          'group-focus-within:opacity-100 group-focus-within:visible ' +
          'transition-opacity duration-150 ' +
          'bg-neutral-900 text-white text-[11px] leading-snug font-normal ' +
          'px-3 py-2 rounded-md shadow-lg z-20 ' +
          'whitespace-normal text-left normal-case tracking-normal'
        }
      >
        {children}
      </span>
    </span>
  );
}
