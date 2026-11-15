import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  /** Color de la línea de acento superior (2px). Ej. '#ffd700' */
  accent?: string
}

/** Panel nivel 1: vidrio semitransparente con blur 20px y borde 1px. */
export function GlassPanel({ children, className, accent }: GlassPanelProps) {
  return (
    <div
      className={cn('glass-panel rounded-xl', accent && 'accent-line-top', className)}
      style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  )
}
