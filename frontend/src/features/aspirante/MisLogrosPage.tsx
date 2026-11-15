import { GlassPanel } from '@/components/ui/GlassPanel'
import { StateChip, estadoFromPrueba } from '@/components/ui/StateChip'
import { Spinner, EmptyState } from '@/components/ui/Spinner'
import { useApi } from '@/lib/hooks'
import { api } from '@/lib/api'
import { formatFecha } from '@/lib/utils'
import type { Prueba } from '@/types/entities'

interface PruebaConNombre extends Prueba {
  requisito_nombre: string
  seccion_nombre: string
}

/** Historial oficial de logros del aspirante autenticado. */
export function MisLogrosPage() {
  const { data, loading } = useApi<PruebaConNombre[]>(() => api.get('/pruebas/mias'))

  if (loading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>

  return (
    <div className="space-y-md">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Mis logros</h1>
        <p className="text-body-md text-body-md text-on-surface-variant">
          Pruebas oficiales registradas por tu instructor.
        </p>
      </div>

      {!data?.length ? (
        <GlassPanel>
          <EmptyState icon="emoji_events" title="Aún sin logros" subtitle="Cuando tu instructor registre una prueba oficial, aparecerá aquí." />
        </GlassPanel>
      ) : (
        <GlassPanel className="p-base md:p-md">
          <ul className="space-y-sm">
            {data.map((p, i) => (
              <li
                key={i}
                className="flex flex-col justify-between gap-base rounded-lg border border-white/5 bg-white/[0.02] px-sm py-base sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-body-md text-body-md text-on-surface">{p.requisito_nombre}</p>
                  <p className="text-label-sm text-label-sm text-on-surface-variant">
                    {p.seccion_nombre} · {formatFecha(p.fecha_logrado)}
                  </p>
                </div>
                <div className="flex items-center gap-base">
                  <span className="font-headline-md text-headline-md text-primary-container">{p.valor}</span>
                  <StateChip estado={estadoFromPrueba(p.resultado)} />
                </div>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}
    </div>
  )
}
