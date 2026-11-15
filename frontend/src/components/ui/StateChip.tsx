import { cn } from '@/lib/utils'

export type EstadoChip = 'aprobado' | 'pendiente' | 'reprobado' | 'info'

const styles: Partial<Record<EstadoChip, string>> = {
  aprobado: 'bg-tertiary-container/10 text-tertiary-fixed border-tertiary-container/30',
  pendiente: 'bg-primary-container/10 text-primary-fixed border-primary-container/30',
  reprobado: 'bg-error-container/20 text-error border-error/30',
  info: 'bg-secondary-container/10 text-secondary border-secondary-container/30',
}

const labels: Partial<Record<EstadoChip, string>> = {
  aprobado: 'Aprobado',
  pendiente: 'Pendiente',
  reprobado: 'Reprobado',
  info: 'En curso',
}

const DEFAULT_STYLE = 'bg-secondary-container/10 text-secondary border-secondary-container/30'
const DEFAULT_LABEL = 'Sin estado'

/** Chip pill con fondo semitransparente y texto del color de marca. */
export function StateChip({ estado, label }: { estado: EstadoChip; label?: string }) {
  // Si llega un estado desconocido (dato corrupto), usa estilo/etiqueta por defecto.
  const style = styles[estado] ?? DEFAULT_STYLE
  const text = label ?? labels[estado] ?? DEFAULT_LABEL
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-label-sm text-label-sm font-medium',
        style,
      )}
    >
      {text}
    </span>
  )
}

export function estadoFromPrueba(
  resultado: 'aprobado' | 'reprobado' | null | undefined,
): EstadoChip {
  if (resultado === 'aprobado') return 'aprobado'
  if (resultado === 'reprobado') return 'reprobado'
  if (resultado == null || resultado === 'pendiente') return 'pendiente'
  // valor desconocido (p.ej. dato corrupto del backend) → 'info'
  return 'info'
}

