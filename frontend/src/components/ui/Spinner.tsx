/** Spinner circular glass, usado en estados de carga. */
export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white/10 border-t-primary-container"
      style={{ width: size, height: size }}
      aria-label="Cargando"
    />
  )
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="material-symbols-outlined text-4xl text-outline">{icon}</span>
      <p className="font-label-md text-label-md text-on-surface">{title}</p>
      {subtitle && (
        <p className="max-w-sm text-body-md text-body-md text-on-surface-variant">{subtitle}</p>
      )}
    </div>
  )
}
