import type { ReactNode } from 'react';

interface CheckProps {
  children: ReactNode;
  /** "yes" = ✓, "no" = — */
  state?: 'yes' | 'no';
  /** CSS color for the check mark */
  color?: string;
}

export function Check({ children, state = 'yes', color = '#16a34a' }: CheckProps) {
  return (
    <li className="relative pl-5 text-[13px] leading-[1.55] text-neutral-800">
      <span
        aria-hidden
        className="absolute left-0 top-0 font-bold"
        style={{ color: state === 'no' ? '#d4d4d4' : color }}
      >
        {state === 'no' ? '—' : '✓'}
      </span>
      {children}
    </li>
  );
}
