import { cn } from '@/lib/utils'

export type EstadoChip = 'aprobado' | 'pendiente' | 'reprobado' | 'info'

const styles: Record<EstadoChip, string> = {
  aprobado: 'bg-tertiary-container/10 text-tertiary-fixed border-tertiary-container/30',
  pendiente: 'bg-primary-container/10 text-primary-fixed border-primary-container/30',
  reprobado: 'bg-error-container/20 text-error border-error/30',
  info: 'bg-secondary-container/10 text-secondary border-secondary-container/30',
}

const labels: Record<EstadoChip, string> = {
  aprobado: 'Aprobado',
  pendiente: 'Pendiente',
  reprobado: 'Reprobado',
  info: 'En curso',
}

/** Chip pill con fondo semitransparente y texto del color de marca. */
export function StateChip({ estado, label }: { estado: EstadoChip; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-label-sm text-label-sm font-medium',
        styles[estado],
      )}
    >
      {label ?? labels[estado]}
    </span>
  )
}

export function estadoFromPrueba(resultado: 'aprobado' | 'reprobado' | null | undefined): EstadoChip {
  if (resultado === 'aprobado') return 'aprobado'
  if (resultado === 'reprobado') return 'reprobado'
  return 'pendiente'
}
