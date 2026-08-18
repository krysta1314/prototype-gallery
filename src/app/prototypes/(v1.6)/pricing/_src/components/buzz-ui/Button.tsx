import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Variant = 'dark' | 'accent' | 'secondary' | 'outline';

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant: Variant;
  children: ReactNode;
}

const styles: Record<Variant, string> = {
  dark: 'bg-[#0a0a0a] text-white hover:opacity-90',
  accent: 'bg-[#f97316] text-white hover:opacity-90',
  secondary: 'bg-[#7c3aed] text-white hover:opacity-90',
  outline: 'border border-[#0a0a0a] text-[#0a0a0a] bg-white hover:bg-neutral-50',
};

export function Button({ variant, children, className = '', href = '#', ...rest }: ButtonProps) {
  return (
    <a
      href={href}
      className={`block w-full text-center px-4 py-3 rounded-[10px] font-semibold text-sm transition-opacity transition-colors ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
}
