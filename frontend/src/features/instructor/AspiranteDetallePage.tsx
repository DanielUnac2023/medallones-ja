import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StateChip, estadoFromPrueba } from '@/components/ui/StateChip'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Spinner, EmptyState } from '@/components/ui/Spinner'
import { useApi } from '@/lib/hooks'
import { api } from '@/lib/api'
import type { RequisitoConEstado } from '@/types/entities'

/** Detalle de un aspirante: requisitos agrupados por sección + registro de prueba. */
export function AspiranteDetallePage() {
  const { aspiranteId } = useParams<{ aspiranteId: string }>()
  const { data, loading, reload } = useApi<RequisitoConEstado[]>(
    () => api.get(`/instructor/requisitos?aspirante_id=${aspiranteId}`),
    [aspiranteId],
  )
  const [seleccionado, setSeleccionado] = useState<RequisitoConEstado | null>(null)

  const agrupados = useMemo(() => {
    const map = new Map<string, { seccion: string; items: RequisitoConEstado[] }>()
    for (const item of data ?? []) {
      const key = item.seccion.id_seccion
      if (!map.has(key)) map.set(key, { seccion: item.seccion.seccion, items: [] })
      map.get(key)!.items.push(item)
    }
    return Array.from(map.values())
  }, [data])

  if (loading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/aspirantes" className="text-label-md text-label-md text-secondary hover:underline">
            ← Volver a aspirantes
          </Link>
          <h1 className="mt-xs font-headline-lg text-headline-lg text-primary">
            {data?.[0] ? 'Detalle del aspirante' : 'Aspirante'}
          </h1>
        </div>
      </div>

      {!agrupados.length ? (
        <GlassPanel><EmptyState icon="checklist" title="Sin requisitos" subtitle="Crea secciones y requisitos desde Requisitos." /></GlassPanel>
      ) : (
        agrupados.map((grupo) => (
          <GlassPanel key={grupo.seccion} accent="#e9c400" className="p-base md:p-md">
            <h2 className="mb-md font-headline-md text-headline-md text-primary-container">
              {grupo.seccion}
            </h2>
            <ul className="space-y-sm">
              {grupo.items.map((item) => {
                const estado = estadoFromPrueba(item.prueba?.resultado)
                return (
                  <li
                    key={item.requisito.id_requisito}
                    className="flex flex-col gap-base rounded-lg border border-white/5 bg-white/[0.02] p-base md:flex-row md:items-center md:gap-gutter"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-body-md text-body-md text-on-surface">{item.requisito.requisito}</p>
                      <p className="text-label-sm text-label-sm text-on-surface-variant">
                        Referencia: {item.requisito.referencia || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-base md:min-w-56">
                      <div className="flex-1">
                        <div className="mb-xs flex justify-between text-label-sm text-label-sm">
                          <span className="text-on-surface-variant">
                            {item.progreso ? `Progreso: ${item.progreso.valor_registrado}` : 'Sin progreso'}
                          </span>
                          {item.prueba && <span className="text-tertiary-fixed">{item.prueba.valor}</span>}
                        </div>
                        <ProgressBar
                          porcentaje={item.prueba?.resultado === 'aprobado' ? 100 : item.progreso ? Math.min(100, item.progreso.valor_registrado) : 0}
                          colorClass={
                            estado === 'aprobado' ? 'bg-tertiary-fixed-dim' : estado === 'reprobado' ? 'bg-error' : 'bg-secondary-container'
                          }
                        />
                      </div>
                      <StateChip estado={estado} />
                      <Button size="sm" variant="secondary" onClick={() => setSeleccionado(item)}>
                        <span className="material-symbols-outlined text-[18px]">add_task</span>
                        Prueba
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </GlassPanel>
        ))
      )}

      <Modal open={!!seleccionado} onClose={() => setSeleccionado(null)} title="Registrar prueba">
        {seleccionado && <RegistrarPruebaForm requisito={seleccionado} aspiranteId={aspiranteId!} onDone={() => { setSeleccionado(null); reload() }} />}
      </Modal>
    </div>
  )
}

const pruebaSchema = z.object({
  resultado: z.enum(['aprobado', 'reprobado']),
  valor: z.string().min(1, 'Ingresa la medición'),
  fecha_logrado: z.string().min(1, 'Fecha requerida'),
})

function RegistrarPruebaForm({
  requisito,
  aspiranteId,
  onDone,
}: {
  requisito: RequisitoConEstado
  aspiranteId: string
  onDone: () => void
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof pruebaSchema>>({
    resolver: zodResolver(pruebaSchema),
    defaultValues: { resultado: 'aprobado' as const, valor: '', fecha_logrado: new Date().toISOString().slice(0, 10) },
  })
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: { resultado: string; valor: string; fecha_logrado: string }) => {
    setError(null)
    try {
      await api.post('/pruebas', {
        aspirante_id: aspiranteId,
        requisito_id: requisito.requisito.id_requisito,
        ...data,
      })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
      <p className="text-body-md text-body-md text-on-surface-variant">
        {requisito.requisito.requisito} — <span className="text-primary">{requisito.requisito.referencia}</span>
      </p>
      <div className="space-y-xs">
        <label className="block text-label-md text-label-md uppercase text-on-surface-variant">Resultado</label>
        <select
          {...register('resultado')}
          className="input-ghost w-full rounded-md bg-surface px-3 py-2.5 text-body-md text-on-surface"
        >
          <option value="aprobado">Aprobado</option>
          <option value="reprobado">Reprobado</option>
        </select>
      </div>
      <Input label="Medición (ej. 1.85 m, 12 seg, 15 reps)" placeholder="Medición" {...register('valor')} error={errors.valor?.message} />
      <Input label="Fecha del logro" type="date" {...register('fecha_logrado')} error={errors.fecha_logrado?.message} />
      {error && <p className="text-error text-label-sm text-label-sm">{error}</p>}
      <div className="flex justify-end gap-base">
        <Button type="button" variant="ghost" onClick={onDone}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Registrar logro'}</Button>
      </div>
    </form>
  )
}
