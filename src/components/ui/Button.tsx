import React from 'react';
import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold select-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-xs hover:bg-primary-hover',
  secondary: 'border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  subtle: 'bg-primary-light text-primary hover:bg-indigo-100',
  danger: 'bg-error text-white shadow-xs hover:bg-red-700',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-small',
  md: 'h-10 px-4 text-body',
  lg: 'h-12 px-5 text-card',
  icon: 'h-10 w-10',
  'icon-sm': 'h-8 w-8',
};

export function buttonClasses(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className = '') {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  className = '',
  type = 'button',
  disabled,
  children,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

type ButtonLinkProps = Omit<React.ComponentProps<typeof Link>, 'className'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function ButtonLink({ variant = 'secondary', size = 'md', className = '', ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
