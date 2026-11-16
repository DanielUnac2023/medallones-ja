import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StateChip, estadoFromPrueba } from '@/components/ui/StateChip'
import { Spinner, EmptyState } from '@/components/ui/Spinner'
import { useApi } from '@/lib/hooks'
import { api } from '@/lib/api'
import { cn, formatFecha } from '@/lib/utils'
import { etiquetaUnidad, type AspirantesDeRequisito, type ResultadoPrueba } from '@/types/entities'

interface Borrador {
  resultado: ResultadoPrueba | null
  valor: string
}

/**
 * Evaluación grupal: todos los aspirantes del club que tienen este requisito en su plan.
 * El instructor marca aprobado/reprobado y la medición de cada uno y guarda en un solo paso.
 */
export function EvaluarRequisitoPage() {
  const { requisitoId } = useParams<{ requisitoId: string }>()
  const { data, loading, error, reload } = useApi<AspirantesDeRequisito>(
    () => api.get(`/instructor/requisitos/${requisitoId}/aspirantes`),
    [requisitoId],
  )
  const [borradores, setBorradores] = useState<Record<string, Borrador>>({})
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [soloPendientes, setSoloPendientes] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const filas = useMemo(
    () => (data?.aspirantes ?? []).filter((a) => !soloPendientes || a.resultado !== 'aprobado'),
    [data, soloPendientes],
  )
  const cambios = Object.entries(borradores).filter(([, b]) => b.resultado)

  const editar = (id: string, cambio: Partial<Borrador>) =>
    setBorradores((prev) => {
      const base = prev[id] ?? { resultado: null, valor: data?.aspirantes.find((a) => a.aspirante_id === id)?.valor ?? '' }
      return { ...prev, [id]: { ...base, ...cambio } }
    })

  const guardar = async () => {
    setMensaje(null)
    setGuardando(true)
    try {
      await api.post(`/instructor/requisitos/${requisitoId}/evaluaciones`, {
        evaluaciones: cambios.map(([aspirante_id, b]) => ({
          aspirante_id,
          resultado: b.resultado,
          valor: b.valor,
          fecha_logrado: fecha,
        })),
      })
      setMensaje({ tipo: 'ok', texto: `${cambios.length} evaluaciones guardadas` })
      setBorradores({})
      reload()
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo guardar' })
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>
  if (error || !data) {
    return <GlassPanel><EmptyState icon="error" title="No se pudo cargar el requisito" subtitle={error ?? undefined} /></GlassPanel>
  }

  const r = data.requisito
  const aprobados = data.aspirantes.filter((a) => a.resultado === 'aprobado').length

  return (
    <div className="space-y-lg">
      <div>
        <Link to="/requisitos" className="text-label-md text-label-md text-secondary hover:underline">
          ← Volver a requisitos
        </Link>
        <p className="mt-xs text-label-md text-label-md text-on-surface-variant">
          {data.medallon?.tipo_medallon ?? '—'} › {data.seccion?.seccion ?? '—'}
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary">{r.requisito}</h1>
        <p className="text-body-md text-body-md text-on-surface-variant">
          Referencia: <span className="text-primary">{r.referencia || '—'}</span> · {etiquetaUnidad(r.unidad)} ·{' '}
          {aprobados} de {data.aspirantes.length} aprobados
        </p>
      </div>

      <GlassPanel className="flex flex-col gap-base p-base md:flex-row md:items-end md:justify-between md:p-md">
        <div className="flex flex-col gap-base md:flex-row md:items-end">
          <Input label="Fecha de la prueba" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <label className="flex cursor-pointer items-center gap-sm pb-2.5 text-body-md text-body-md text-on-surface">
            <input type="checkbox" className="accent-[#ffd700]" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} />
            Ocultar aprobados
          </label>
        </div>
        <Button onClick={guardar} disabled={guardando || !cambios.length}>
          <span className="material-symbols-outlined text-[20px]">save</span>
          {guardando ? 'Guardando…' : `Guardar ${cambios.length || ''} evaluaciones`}
        </Button>
      </GlassPanel>

      {mensaje && (
        <p className={cn('text-label-md text-label-md', mensaje.tipo === 'ok' ? 'text-tertiary-fixed' : 'text-error')}>
          {mensaje.texto}
        </p>
      )}

      {!filas.length ? (
        <GlassPanel>
          <EmptyState
            icon="groups"
            title={data.aspirantes.length ? 'Todos aprobados' : 'Ningún aspirante tiene este requisito'}
            subtitle={data.aspirantes.length ? undefined : 'Aparecerán aquí los aspirantes que lo elijan en su plan.'}
          />
        </GlassPanel>
      ) : (
        <GlassPanel className="p-base md:p-md">
          <ul className="divide-y divide-white/5">
            {filas.map((a) => {
              const b = borradores[a.aspirante_id]
              return (
                <li key={a.aspirante_id} className="flex flex-col gap-base py-sm md:flex-row md:items-center md:gap-gutter">
                  <div className="min-w-0 flex-1">
                    <Link to={`/aspirantes/${a.aspirante_id}`} className="text-body-md text-body-md text-on-surface hover:underline">
                      {a.aspirante_nombre}
                    </Link>
                    <div className="mt-xs flex items-center gap-sm">
                      <StateChip estado={estadoFromPrueba(a.resultado)} />
                      {a.resultado && (
                        <span className="text-label-sm text-label-sm text-on-surface-variant">
                          {a.valor || '—'} · {formatFecha(a.fecha_logrado)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Input
                    aria-label={`Medición de ${a.aspirante_nombre}`}
                    placeholder={`Medición (${etiquetaUnidad(r.unidad).toLowerCase()})`}
                    value={b?.valor ?? a.valor ?? ''}
                    onChange={(e) => editar(a.aspirante_id, { valor: e.target.value })}
                    className="md:w-48"
                  />
                  <div className="flex gap-xs">
                    {(['aprobado', 'reprobado'] as const).map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => editar(a.aspirante_id, { resultado: b?.resultado === res ? null : res })}
                        className={cn(
                          'rounded-md border px-3 py-2 text-label-md text-label-md transition-all',
                          b?.resultado === res
                            ? res === 'aprobado'
                              ? 'border-tertiary-container bg-tertiary-container/20 text-tertiary-fixed'
                              : 'border-error bg-error-container/30 text-error'
                            : 'border-white/10 bg-white/[0.02] text-on-surface-variant hover:text-on-surface',
                        )}
                      >
                        {res === 'aprobado' ? 'Aprobar' : 'Reprobar'}
                      </button>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </GlassPanel>
      )}
    </div>
  )
}
