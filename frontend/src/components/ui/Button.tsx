import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Primary: gold sólido con texto oscuro + glow en hover.
 * Secondary: glass con borde blanco y texto claro.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      'bg-primary-container text-on-primary-container font-bold kinetic-glow hover:bg-primary-fixed',
    secondary:
      'glass-panel text-on-surface hover:bg-white/10 border border-white/10',
    ghost: 'text-on-surface-variant hover:text-on-surface hover:bg-white/5',
    danger:
      'bg-error-container text-on-error-container hover:brightness-110 border border-white/10',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-label-sm text-label-sm',
    md: 'px-4 py-2.5 text-label-md',
    lg: 'px-6 py-3 text-label-md',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
