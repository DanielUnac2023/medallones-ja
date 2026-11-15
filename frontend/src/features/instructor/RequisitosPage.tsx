import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner, EmptyState } from '@/components/ui/Spinner'
import { useApi } from '@/lib/hooks'
import { api } from '@/lib/api'
import type { Requisito, Seccion, TipoMedallon } from '@/types/entities'

/** CRUD de secciones y requisitos (solo instructor/admin). */
export function RequisitosPage() {
  const { data: secciones, loading, reload } = useApi<Seccion[]>(() => api.get('/secciones'))
  const { data: requisitos } = useApi<Requisito[]>(() => api.get('/requisitos'))
  const { data: medallones } = useApi<TipoMedallon[]>(() => api.get('/medallones'))

  const [modal, setModal] = useState<null | { tipo: 'seccion' | 'requisito'; item?: Seccion | Requisito }>(null)

  if (loading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Requisitos y secciones</h1>
          <p className="text-body-md text-body-md text-on-surface-variant">
            Administra el catálogo de evaluación del club.
          </p>
        </div>
        <div className="flex gap-base">
          <Button variant="secondary" onClick={() => setModal({ tipo: 'seccion' })}>
            <span className="material-symbols-outlined text-[20px]">add</span> Sección
          </Button>
          <Button onClick={() => setModal({ tipo: 'requisito' })}>
            <span className="material-symbols-outlined text-[20px]">add</span> Requisito
          </Button>
        </div>
      </div>

      {/* Secciones */}
      <section className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
        {(secciones ?? []).map((s) => {
          const items = (requisitos ?? []).filter((r) => r.seccion_id === s.id_seccion)
          const medallon = medallones?.find((m) => m.id_tipo === s.medallon_id)
          return (
            <GlassPanel key={s.id_seccion} accent="#7af386" className="flex flex-col p-base md:p-md">
              <div className="mb-sm flex items-start justify-between">
                <div>
                  <h2 className="font-headline-md text-headline-md text-tertiary-fixed">{s.seccion}</h2>
                  <p className="text-label-sm text-label-sm text-on-surface-variant">
                    {medallon?.tipo_medallon ?? 'Sin medallón'} · {items.length} requisitos
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setModal({ tipo: 'seccion', item: s })}>
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </Button>
              </div>
              <ul className="flex-1 space-y-xs">
                {items.map((r) => (
                  <li
                    key={r.id_requisito}
                    className="group flex items-center justify-between gap-base rounded-md border border-white/5 bg-white/[0.02] px-sm py-base"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-body-md text-body-md text-on-surface">{r.requisito}</p>
                      <p className="text-label-sm text-label-sm text-on-surface-variant">{r.referencia}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-xs">
                      <span className="rounded-full bg-primary-container/10 px-2 py-1 text-label-sm text-label-sm text-primary-fixed">
                        {r.unidad}
                      </span>
                      <button
                        onClick={() => setModal({ tipo: 'requisito', item: r })}
                        aria-label={`Editar ${r.requisito}`}
                        className="rounded-md p-1 text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </div>
                  </li>
                ))}
                {!items.length && <li className="py-sm text-label-sm text-label-sm text-on-surface-variant">Sin requisitos.</li>}
              </ul>
            </GlassPanel>
          )
        })}
        {!secciones?.length && (
          <GlassPanel className="col-span-full"><EmptyState icon="category" title="Sin secciones" subtitle="Crea la primera sección para empezar a construir el catálogo." /></GlassPanel>
        )}
      </section>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={
          modal?.tipo === 'seccion'
            ? modal.item ? 'Editar sección' : 'Nueva sección'
            : modal?.item ? 'Editar requisito' : 'Nuevo requisito'
        }
      >
        {modal?.tipo === 'seccion' ? (
          <SeccionForm
            inicial={modal.item as Seccion | undefined}
            medallones={medallones ?? []}
            onDone={() => { setModal(null); reload() }}
          />
        ) : (
          <RequisitoForm
            inicial={modal?.item as Requisito | undefined}
            secciones={secciones ?? []}
            onDone={() => { setModal(null); reload() }}
          />
        )}
      </Modal>
    </div>
  )
}

function SeccionForm({ inicial, medallones, onDone }: { inicial?: Seccion; medallones: TipoMedallon[]; onDone: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Seccion>({
    defaultValues: inicial ?? { id_seccion: '', seccion: '', medallon_id: '' },
  })
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: Seccion) => {
    setError(null)
    try {
      if (inicial) await api.patch(`/secciones/${inicial.id_seccion}`, data)
      else await api.post('/secciones', data)
      onDone()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error al guardar') }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
      <Input label="Nombre de sección" {...register('seccion', { required: 'Requerido' })} error={errors.seccion?.message} />
      <div className="space-y-xs">
        <label className="block text-label-md text-label-md uppercase text-on-surface-variant">Medallón</label>
        <select {...register('medallon_id', { required: 'Requerido' })} className="input-ghost w-full rounded-md bg-surface px-3 py-2.5 text-body-md text-on-surface">
          <option value="">Seleccionar…</option>
          {medallones.map((m) => <option key={m.id_tipo} value={m.id_tipo}>{m.tipo_medallon}</option>)}
        </select>
      </div>
      {error && <p className="text-error text-label-sm text-label-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : inicial ? 'Actualizar' : 'Crear'}</Button>
    </form>
  )
}

function RequisitoForm({ inicial, secciones, onDone }: { inicial?: Requisito; secciones: Seccion[]; onDone: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Requisito>({
    defaultValues: inicial ?? { id_requisito: '', seccion_id: '', requisito: '', referencia: '', unidad: 'reps' },
  })
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: Requisito) => {
    setError(null)
    try {
      if (inicial) await api.patch(`/requisitos/${inicial.id_requisito}`, data)
      else await api.post('/requisitos', data)
      onDone()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error al guardar') }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
      <Input label="Requisito (ej. Salto alto)" {...register('requisito', { required: 'Requerido' })} error={errors.requisito?.message} />
      <Input label="Referencia (medida o tiempo a cumplir)" {...register('referencia')} error={errors.referencia?.message} />
      <div className="grid grid-cols-2 gap-base">
        <div className="space-y-xs">
          <label className="block text-label-md text-label-md uppercase text-on-surface-variant">Sección</label>
          <select {...register('seccion_id', { required: 'Requerido' })} className="input-ghost w-full rounded-md bg-surface px-3 py-2.5 text-body-md text-on-surface">
            <option value="">Seleccionar…</option>
            {secciones.map((s) => <option key={s.id_seccion} value={s.id_seccion}>{s.seccion}</option>)}
          </select>
        </div>
        <div className="space-y-xs">
          <label className="block text-label-md text-label-md uppercase text-on-surface-variant">Unidad de progreso</label>
          <select {...register('unidad')} className="input-ghost w-full rounded-md bg-surface px-3 py-2.5 text-body-md text-on-surface">
            <option value="reps">Reps</option>
            <option value="segundos">Segundos</option>
          </select>
        </div>
      </div>
      {error && <p className="text-error text-label-sm text-label-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : inicial ? 'Actualizar' : 'Crear'}</Button>
    </form>
  )
}
