import { Link } from 'react-router-dom'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StateChip, estadoFromPrueba } from '@/components/ui/StateChip'
import { Spinner, EmptyState } from '@/components/ui/Spinner'
import { useApi } from '@/lib/hooks'
import { api } from '@/lib/api'
import { formatFecha } from '@/lib/utils'
import type { AspiranteResumen, RequisitoConEstado } from '@/types/entities'

/** Dashboard del instructor: vista global de su club. */
export function InstructorDashboard() {
  const { data: resumenes, loading } = useApi<AspiranteResumen[]>(() =>
    api.get('/instructor/aspirantes'),
  )
  const { data: requisitos } = useApi<RequisitoConEstado[]>(() =>
    api.get('/requisitos?con_estado=1'),
  )

  const totalAspirantes = resumenes?.length ?? 0
  const totalAprobados = resumenes?.filter((a) => a.aprobados === a.total_requisitos && a.total_requisitos > 0).length ?? 0
  const pctGlobal = totalAspirantes
    ? Math.round((resumenes!.reduce((s, a) => s + a.progreso_pct, 0) / totalAspirantes))
    : 0
  const totalRequisitos = requisitos?.length ?? 0

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-lg">
      {/* Hero */}
      <section>
        <GlassPanel className="relative flex flex-col items-center justify-between gap-xl overflow-hidden p-lg md:flex-row">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary-container/10 blur-[100px]" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-secondary-container/10 blur-[100px]" />

          <div className="relative z-10 space-y-md text-center md:text-left">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
              <span className="mr-3 h-2 w-2 animate-pulse rounded-full bg-primary-container" />
              <span className="text-label-md text-label-md uppercase tracking-widest text-primary">
                {totalAspirantes} aspirantes · {totalRequisitos} requisitos
              </span>
            </div>
            <h1 className="font-display-lg text-display-lg leading-tight text-primary">
              Panel<br />Instructor
            </h1>
            <p className="max-w-md text-body-lg text-body-lg text-on-surface-variant">
              Supervisa el avance de tus aspirantes, registra logros oficiales y administra el
              catálogo de requisitos del club.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-base">
            <ProgressRing porcentaje={pctGlobal}>
              <span className="font-headline-lg text-headline-lg text-primary">{pctGlobal}%</span>
              <span className="text-label-sm text-label-sm uppercase text-on-surface-variant">
                Progreso club
              </span>
            </ProgressRing>
            <div className="flex gap-gutter">
              <div className="text-center">
                <p className="font-headline-md text-headline-md text-primary-container">{totalAprobados}</p>
                <p className="text-label-sm text-label-sm uppercase text-on-surface-variant">Completos</p>
              </div>
              <div className="h-10 w-px self-center bg-white/10" />
              <div className="text-center">
                <p className="font-headline-md text-headline-md text-secondary">
                  {totalAspirantes - totalAprobados}
                </p>
                <p className="text-label-sm text-label-sm uppercase text-on-surface-variant">En curso</p>
              </div>
            </div>
          </div>
        </GlassPanel>
      </section>

      {/* Lista de aspirantes */}
      <section>
        <div className="mb-md flex items-center justify-between px-base">
          <h2 className="font-headline-md text-headline-md text-primary">Aspirantes</h2>
          <Link
            to="/aspirantes"
            className="flex items-center gap-xs text-label-md text-label-md text-primary-container hover:underline"
          >
            Ver todos <span className="material-symbols-outlined">chevron_right</span>
          </Link>
        </div>

        {!resumenes?.length ? (
          <GlassPanel>
            <EmptyState
              icon="groups"
              title="Sin aspirantes aún"
              subtitle="Registra aspirantes desde el catálogo para comenzar a dar seguimiento."
            />
          </GlassPanel>
        ) : (
          <div className="space-y-base">
            {resumenes.slice(0, 5).map((a) => (
              <GlassPanel key={a.aspirante.id_usuario} className="p-sm md:p-base">
                <div className="flex flex-col gap-base md:flex-row md:items-center md:gap-gutter">
                  <div className="flex flex-1 items-center gap-base">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-container/20 font-headline-md text-headline-md text-primary-container">
                      {a.aspirante.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-body-lg text-body-lg text-primary">
                        {a.aspirante.nombre}
                      </h3>
                      <p className="text-label-sm text-label-sm text-on-surface-variant">
                        {a.aspirante.email}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-40 flex-1">
                    <div className="mb-xs flex justify-between text-label-sm text-label-sm">
                      <span className="text-on-surface-variant">
                        {a.aprobados} / {a.total_requisitos} aprobados
                      </span>
                      <span className="text-primary-container">{a.progreso_pct}%</span>
                    </div>
                    <ProgressBar
                      porcentaje={a.progreso_pct}
                      colorClass={
                        a.progreso_pct === 100 ? 'bg-tertiary-fixed-dim' : 'bg-secondary-container'
                      }
                    />
                  </div>
                  <Link
                    to={`/aspirantes/${a.aspirante.id_usuario}`}
                    className="flex items-center justify-center gap-xs rounded-md border border-white/10 bg-white/5 px-base py-2.5 text-label-md text-label-md text-on-surface transition-all hover:bg-primary-container hover:text-on-primary-container"
                  >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                    VER
                  </Link>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </section>

      {/* Pruebas recientes */}
      <section>
        <RecentPruebas />
      </section>
    </div>
  )
}

function RecentPruebas() {
  const { data, loading } = useApi(() => api.get<Array<{ prueba: import('@/types/entities').Prueba; aspirante_nombre: string; requisito_nombre: string }>>('/instructor/pruebas-recientes'))

  return (
    <GlassPanel accent="#4a8eff" className="p-base md:p-md">
      <h2 className="mb-md font-headline-md text-headline-md text-primary">Logros recientes</h2>
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={28} /></div>
      ) : !data?.length ? (
        <EmptyState icon="emoji_events" title="Sin logros registrados" subtitle="Los logros que registres aparecerán aquí." />
      ) : (
        <ul className="space-y-sm">
          {data.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-base border-b border-white/5 py-sm last:border-0">
              <div>
                <p className="text-body-md text-body-md text-on-surface">{r.aspirante_nombre}</p>
                <p className="text-label-sm text-label-sm text-on-surface-variant">{r.requisito_nombre}</p>
              </div>
              <div className="text-right">
                <StateChip estado={estadoFromPrueba(r.prueba.resultado)} />
                <p className="mt-xs text-label-sm text-label-sm text-on-surface-variant">{formatFecha(r.prueba.fecha_logrado)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  )
}
