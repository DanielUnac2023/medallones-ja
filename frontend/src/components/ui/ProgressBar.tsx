import { cn } from '@/lib/utils'

interface ProgressBarProps {
  porcentaje: number // 0-100
  colorClass?: string
  className?: string
}

/** Barra de progreso lineal, como las de las tarjetas del mockup. */
export function ProgressBar({
  porcentaje,
  colorClass = 'bg-secondary-container',
  className,
}: ProgressBarProps) {
  return (
    <div
      className={cn(
        'h-1.5 w-full overflow-hidden rounded-full bg-white/5',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(porcentaje)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-300', colorClass)}
        style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%` }}
      />
    </div>
  )
}
