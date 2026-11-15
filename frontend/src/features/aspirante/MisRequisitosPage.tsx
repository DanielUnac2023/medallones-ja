import { useEffect, useRef, useState } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Input } from '@/components/ui/Input'
import { StateChip, estadoFromPrueba } from '@/components/ui/StateChip'
import { Spinner, EmptyState } from '@/components/ui/Spinner'
import { useApi } from '@/lib/hooks'
import { api } from '@/lib/api'
import { formatFecha } from '@/lib/utils'
import type { RequisitoConEstado } from '@/types/entities'

/**
 * Panel del aspirante: cada requisito muestra su referencia, estado oficial y un
 * campo de progreso editable que se auto-guarda (debounce 600ms).
 */
export function MisRequisitosPage() {
  const { data, loading, reload } = useApi<RequisitoConEstado[]>(() => api.get('/progreso/mio?con_estado=1'))
  const [valores, setValores] = useState<Record<string, string>>({})
  const [guardado, setGuardado] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sincilia los inputs con los valores cargados
  useEffect(() => {
    if (!data) return
    const next: Record<string, string> = {}
    for (const r of data) {
      next[r.requisito.id_requisito] = r.progreso?.valor_registrado?.toString() ?? ''
    }
    setValores((prev) => ({ ...next, ...prev }))
  }, [data])

  const onChange = (requisitoId: string, valor: string) => {
    setValores((v) => ({ ...v, [requisitoId]: valor }))
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const num = Number(valor)
      if (valor === '' || Number.isNaN(num)) return
      try {
        await api.put(`/progreso/mio/${requisitoId}`, { valor_registrado: num })
        setGuardado(requisitoId)
        setTimeout(() => setGuardado(null), 1500)
        reload()
      } catch {
        /* silencioso; el usuario puede reintentar */
      }
    }, 600)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>

  if (!data?.length) {
    return (
      <GlassPanel>
        <EmptyState icon="checklist" title="Sin requisitos" subtitle="Tu instructor aún no ha publicado requisitos para ti." />
      </GlassPanel>
    )
  }

  return (
    <div className="space-y-md">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Mis requisitos</h1>
        <p className="text-body-md text-body-md text-on-surface-variant">
          Registra tu avance (reps o segundos) y confirma que vas por buen camino para la prueba oficial.
        </p>
      </div>

      <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
        {data.map((item) => (
          <RequisitoCard
            key={item.requisito.id_requisito}
            item={item}
            valor={valores[item.requisito.id_requisito] ?? ''}
            onChange={(v) => onChange(item.requisito.id_requisito, v)}
            recienGuardado={guardado === item.requisito.id_requisito}
          />
        ))}
      </div>
    </div>
  )
}

function RequisitoCard({
  item, valor, onChange, recienGuardado,
}: {
  item: RequisitoConEstado
  valor: string
  onChange: (v: string) => void
  recienGuardado: boolean
}) {
  const estado = estadoFromPrueba(item.prueba?.resultado)
  const unidad = item.requisito.unidad === 'segundos' ? 'seg' : 'reps'

  return (
    <GlassPanel accent={estado === 'aprobado' ? '#7af386' : estado === 'reprobado' ? '#ffb4ab' : '#ffd700'} className="flex flex-col gap-base p-base md:p-md">
      <div className="flex items-start justify-between gap-base">
        <div className="min-w-0">
          <h2 className="truncate font-headline-md text-headline-md text-primary">{item.requisito.requisito}</h2>
          <p className="text-label-sm text-label-sm text-on-surface-variant">
            {item.seccion.seccion} · Referencia: {item.requisito.referencia || '—'}
          </p>
        </div>
        <StateChip estado={estado} />
      </div>

      {item.prueba && (
        <p className="rounded-md border border-tertiary-container/30 bg-tertiary-container/10 px-sm py-base text-label-sm text-label-sm text-tertiary-fixed">
          Logro oficial: <strong>{item.prueba.valor}</strong> — {formatFecha(item.prueba.fecha_logrado)}
        </p>
      )}

      <div className="mt-auto space-y-xs">
        <label className="block text-label-md text-label-md uppercase text-on-surface-variant">
          Mi progreso ({unidad})
        </label>
        <div className="flex items-center gap-base">
          <Input
            type="number"
            min={0}
            value={valor}
            placeholder="0"
            aria-label={`Progreso de ${item.requisito.requisito}`}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1"
          />
          {recienGuardado ? (
            <span className="inline-flex items-center gap-xs text-label-sm text-label-sm text-tertiary-fixed">
              <span className="material-symbols-outlined text-[16px]">check_circle</span> Guardado
            </span>
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">sync</span>
          )}
        </div>
      </div>
    </GlassPanel>
  )
}
