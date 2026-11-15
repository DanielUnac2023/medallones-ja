import { cn } from '@/lib/utils'
import React, { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

/** Input ghost: borde 1px white/10, focus borde gold + glow. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
  const inputId = id ?? props.name
  return (
    <div className="space-y-xs">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-label-md text-label-md text-on-surface-variant uppercase"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'input-ghost w-full rounded-md px-3 py-2.5 text-body-md text-on-surface',
          error && 'border-error',
          className,
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="text-error text-label-sm text-label-sm">{error}</p>}
    </div>
  )
}
)
