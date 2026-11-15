import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Input } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Spinner, EmptyState } from '@/components/ui/Spinner'
import { useApi } from '@/lib/hooks'
import { api } from '@/lib/api'
import type { AspiranteResumen, RequisitoConEstado } from '@/types/entities'

type EstadoFiltro = 'todos' | 'aprobado' | 'pendiente' | 'reprobado'

/** Lista de aspirantes del club con filtros por requisito y estado. */
export function AspirantesPage() {
  const [busqueda, setBusqueda] = useState('')
  const [requisitoFiltro, setRequisitoFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos')

  const { data: requisitos } = useApi<RequisitoConEstado[]>(() => api.get('/requisitos?con_estado=1'))
  const { data: aspirantes, loading } = useApi<AspiranteResumen[]>(
    () =>
      api.get(
        `/instructor/aspirantes?requisito_id=${encodeURIComponent(requisitoFiltro)}&estado=${encodeURIComponent(estadoFiltro)}&q=${encodeURIComponent(busqueda)}`,
      ),
    [requisitoFiltro, estadoFiltro, busqueda],
  )

  if (loading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>

  return (
    <div className="space-y-md">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Aspirantes</h1>
        <p className="text-body-md text-body-md text-on-surface-variant">
          Filtrar por requisito y estado para dar seguimiento.
        </p>
      </div>

      {/* Filtros */}
      <GlassPanel className="grid gap-base p-base md:grid-cols-3 md:p-md">
        <Input
          label="Buscar"
          placeholder="Nombre del aspirante"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="space-y-xs">
          <label className="block text-label-md text-label-md uppercase text-on-surface-variant">Requisito</label>
          <select
            className="input-ghost w-full rounded-md bg-surface px-3 py-2.5 text-body-md text-on-surface"
            value={requisitoFiltro}
            onChange={(e) => setRequisitoFiltro(e.target.value)}
          >
            <option value="">Todos</option>
            {(requisitos ?? []).map((r) => (
              <option key={r.requisito.id_requisito} value={r.requisito.id_requisito}>
                {r.requisito.requisito}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-xs">
          <label className="block text-label-md text-label-md uppercase text-on-surface-variant">Estado</label>
          <select
            className="input-ghost w-full rounded-md bg-surface px-3 py-2.5 text-body-md text-on-surface"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value as EstadoFiltro)}
          >
            <option value="todos">Todos</option>
            <option value="aprobado">Aprobado</option>
            <option value="pendiente">Pendiente</option>
            <option value="reprobado">Reprobado</option>
          </select>
        </div>
      </GlassPanel>

      {!aspirantes?.length ? (
        <GlassPanel>
          <EmptyState icon="search" title="Sin resultados" subtitle="Ajusta los filtros o registra aspirantes desde el catálogo." />
        </GlassPanel>
      ) : (
        <div className="space-y-base">
          {aspirantes.map((a) => (
            <GlassPanel key={a.aspirante.id_usuario} className="p-sm md:p-base">
              <div className="flex flex-col gap-base md:flex-row md:items-center md:gap-gutter">
                <div className="flex flex-1 items-center gap-base">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-secondary/20 bg-secondary-container/10 font-headline-md text-headline-md text-secondary">
                    {a.aspirante.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-body-lg text-body-lg text-primary">{a.aspirante.nombre}</h3>
                    <p className="text-label-sm text-label-sm text-on-surface-variant">{a.aspirante.email}</p>
                  </div>
                </div>
                <div className="min-w-40 flex-1">
                  <div className="mb-xs flex justify-between text-label-sm text-label-sm">
                    <span className="text-on-surface-variant">{a.aprobados} / {a.total_requisitos} aprobados</span>
                    <span className="text-primary-container">{a.progreso_pct}%</span>
                  </div>
                  <ProgressBar porcentaje={a.progreso_pct} colorClass={a.progreso_pct === 100 ? 'bg-tertiary-fixed-dim' : 'bg-secondary-container'} />
                </div>
                <Link
                  to={`/aspirantes/${a.aspirante.id_usuario}`}
                  className="flex items-center justify-center gap-xs rounded-md bg-primary-container px-base py-2.5 text-label-md text-label-md font-bold text-on-primary-container transition-all hover:bg-primary-fixed"
                >
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                  VER
                </Link>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  )
}
