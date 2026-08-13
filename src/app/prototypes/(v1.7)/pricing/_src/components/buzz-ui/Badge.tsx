import type { ReactNode } from 'react';

type Variant = 'popular' | 'team' | 'pill';

interface BadgeProps {
  variant: Variant;
  children: ReactNode;
}

const styles: Record<Variant, string> = {
  popular: 'bg-[#f97316] text-white',
  team: 'bg-[#7c3aed] text-white',
  pill: 'bg-emerald-600 text-white',
};

export function Badge({ variant, children }: BadgeProps) {
  if (variant === 'pill') {
    return (
      <span className={`inline-block ml-1.5 px-1.5 py-px text-[10px] font-bold tracking-wide rounded-full ${styles.pill}`}>
        {children}
      </span>
    );
  }
  return (
    <span
      className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 text-[11px] font-semibold tracking-wide rounded-full whitespace-nowrap ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
