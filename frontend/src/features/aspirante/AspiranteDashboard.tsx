import { GlassPanel } from '@/components/ui/GlassPanel'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { Spinner, EmptyState } from '@/components/ui/Spinner'
import { useApi } from '@/lib/hooks'
import { api } from '@/lib/api'
import { useAuth } from '@/store/authStore'
import type { RequisitoConEstado } from '@/types/entities'

/** Dashboard resumen del aspirante (versión compacta). */
export function AspiranteDashboard() {
  const { user } = useAuth()
  const { data, loading } = useApi<RequisitoConEstado[]>(() => api.get('/progreso/mio?con_estado=1'))

  const total = data?.length ?? 0
  const aprobados = data?.filter((r) => r.prueba?.resultado === 'aprobado').length ?? 0
  const enCurso = data?.filter((r) => r.prueba?.resultado === 'reprobado').length ?? 0
  const pct = total ? Math.round((aprobados / total) * 100) : 0

  if (loading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>

  return (
    <div className="space-y-lg">
      <GlassPanel className="relative flex flex-col items-center justify-between gap-xl overflow-hidden p-lg md:flex-row">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-tertiary-container/10 blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-primary-container/10 blur-[100px]" />

        <div className="relative z-10 space-y-md text-center md:text-left">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
            <span className="mr-3 h-2 w-2 animate-pulse rounded-full bg-tertiary-fixed-dim" />
            <span className="text-label-md text-label-md uppercase tracking-widest text-tertiary-fixed">
              {aprobados} de {total} requisitos logrados
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg leading-tight text-primary">
            ¡Hola, {user?.nombre.split(' ')[0] ?? 'aspirante'}!
          </h1>
          <p className="max-w-md text-body-lg text-body-lg text-on-surface-variant">
            Lleva tu avance al día en cada requisito. Cuando llegue el día de la prueba,
            llegarás con la seguridad de ya cumplir la marca.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-base">
          <ProgressRing porcentaje={pct} color="#7af386">
            <span className="font-headline-lg text-headline-lg text-primary">{pct}%</span>
            <span className="text-label-sm text-label-sm uppercase text-on-surface-variant">Mi progreso</span>
          </ProgressRing>
          <div className="flex gap-gutter">
            <div className="text-center">
              <p className="font-headline-md text-headline-md text-tertiary-fixed">{aprobados}</p>
              <p className="text-label-sm text-label-sm uppercase text-on-surface-variant">Logrados</p>
            </div>
            <div className="h-10 w-px self-center bg-white/10" />
            <div className="text-center">
              <p className="font-headline-md text-headline-md text-secondary">{enCurso}</p>
              <p className="text-label-sm text-label-sm uppercase text-on-surface-variant">Reprobados</p>
            </div>
          </div>
        </div>
      </GlassPanel>

      {!total && (
        <GlassPanel>
          <EmptyState icon="military_tech" title="Sin requisitos asignados" subtitle="Tu instructor aún no ha publicado requisitos para ti." />
        </GlassPanel>
      )}
    </div>
  )
}
