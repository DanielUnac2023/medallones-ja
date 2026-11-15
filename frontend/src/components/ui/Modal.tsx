import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}

/** Modal nivel 2: vidrio más opaco + inner glow. Cierra con Escape y clic fuera. */
export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          'glass-overlay w-full rounded-xl p-6 shadow-2xl',
          wide ? 'max-w-2xl' : 'max-w-md',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-headline-md text-headline-md text-primary">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="material-symbols-outlined text-on-surface-variant hover:text-on-surface"
          >
            close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
