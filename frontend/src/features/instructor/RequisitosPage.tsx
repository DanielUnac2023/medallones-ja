import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner, EmptyState } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { UNIDADES, etiquetaUnidad, type Requisito, type Seccion, type TipoMedallon } from '@/types/entities'
import { useCatalogo } from './InscripcionSelector'

type ModalState =
  | null
  | { tipo: 'medallon'; item: TipoMedallon }
  | { tipo: 'seccion'; item?: Seccion }
  | { tipo: 'requisito'; item?: Requisito; seccionId?: string }

const selectClass = 'input-ghost w-full rounded-md bg-surface px-3 py-2.5 text-body-md text-on-surface'
const labelClass = 'block text-label-md text-label-md uppercase text-on-surface-variant'

/** Catálogo de evaluación: medallón → secciones → requisitos (solo instructor/admin). */
export function RequisitosPage() {
  const { data: cat, loading, reload } = useCatalogo()
  const [medallonId, setMedallonId] = useState('')
  const [modal, setModal] = useState<ModalState>(null)

  useEffect(() => {
    if (!medallonId && cat?.medallones.length) setMedallonId(cat.medallones[0].id_tipo)
  }, [cat, medallonId])

  const medallon = cat?.medallones.find((m) => m.id_tipo === medallonId)
  const secciones = useMemo(
    () => (cat?.secciones ?? []).filter((s) => s.medallon_id === medallonId),
    [cat, medallonId],
  )

  if (loading || !cat) return <div className="flex justify-center py-20"><Spinner size={40} /></div>

  const cerrar = () => setModal(null)
  const guardado = () => { setModal(null); reload() }

  return (
    <div className="space-y-lg">
      <div className="flex flex-col gap-base md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Requisitos y secciones</h1>
          <p className="text-body-md text-body-md text-on-surface-variant">
            Cada medallón tiene secciones y cada sección sus requisitos. Usa “Evaluar” para calificar a todo el grupo en un requisito.
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

      {/* Medallones */}
      <div className="flex flex-wrap gap-base">
        {cat.medallones.map((m) => (
          <button
            key={m.id_tipo}
            onClick={() => setMedallonId(m.id_tipo)}
            className={cn(
              'rounded-full px-4 py-2 text-label-md text-label-md transition-all',
              m.id_tipo === medallonId
                ? 'bg-primary-container text-on-primary-container'
                : 'border border-white/10 bg-white/5 text-on-surface-variant hover:text-on-surface',
            )}
          >
            {m.tipo_medallon}
          </button>
        ))}
      </div>

      {!cat.medallones.length ? (
        <GlassPanel>
          <EmptyState icon="military_tech" title="Sin medallones" subtitle="Crea los medallones en Catálogo." />
        </GlassPanel>
      ) : medallon && (
        <>
          <GlassPanel className="flex flex-col gap-base p-base md:flex-row md:items-center md:justify-between md:p-md">
            <p className="text-body-md text-body-md text-on-surface">
              El aspirante debe elegir al menos{' '}
              <strong className="text-primary">{medallon.secciones_min ?? 1}</strong> de{' '}
              <strong className="text-primary">{secciones.length}</strong> secciones.
            </p>
            <Button size="sm" variant="ghost" onClick={() => setModal({ tipo: 'medallon', item: medallon })}>
              <span className="material-symbols-outlined text-[18px]">tune</span> Cambiar regla
            </Button>
          </GlassPanel>

          <section className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
            {secciones.map((s) => {
              const items = cat.requisitos.filter((r) => r.seccion_id === s.id_seccion)
              return (
                <GlassPanel key={s.id_seccion} accent="#7af386" className="flex flex-col p-base md:p-md">
                  <div className="mb-sm flex items-start justify-between gap-base">
                    <div className="min-w-0">
                      <h2 className="font-headline-md text-headline-md text-tertiary-fixed">{s.seccion}</h2>
                      {s.descripcion && (
                        <p className="text-label-sm text-label-sm text-on-surface-variant">{s.descripcion}</p>
                      )}
                      <p className="mt-xs text-label-sm text-label-sm text-on-surface-variant">
                        Elegir mín. {s.requisitos_min ?? 1} de {items.length} requisitos
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" aria-label={`Editar ${s.seccion}`} onClick={() => setModal({ tipo: 'seccion', item: s })}>
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </Button>
                  </div>
                  <ul className="flex-1 space-y-xs">
                    {items.map((r) => (
                      <li
                        key={r.id_requisito}
                        className="flex items-center justify-between gap-base rounded-md border border-white/5 bg-white/[0.02] px-sm py-base"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-body-md text-body-md text-on-surface">{r.requisito}</p>
                          <p className="text-label-sm text-label-sm text-on-surface-variant">
                            {r.referencia} · {etiquetaUnidad(r.unidad)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-xs">
                          <Link
                            to={`/requisitos/${r.id_requisito}/evaluar`}
                            className="flex items-center gap-xs rounded-md bg-primary-container/15 px-2 py-1 text-label-sm text-label-sm text-primary-fixed hover:bg-primary-container/30"
                          >
                            <span className="material-symbols-outlined text-[16px]">groups</span> Evaluar
                          </Link>
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
                  <Button size="sm" variant="ghost" className="mt-sm self-start" onClick={() => setModal({ tipo: 'requisito', seccionId: s.id_seccion })}>
                    <span className="material-symbols-outlined text-[18px]">add</span> Requisito
                  </Button>
                </GlassPanel>
              )
            })}
            {!secciones.length && (
              <GlassPanel className="col-span-full">
                <EmptyState icon="category" title="Sin secciones" subtitle="Crea la primera sección de este medallón." />
              </GlassPanel>
            )}
          </section>
        </>
      )}

      <Modal
        open={!!modal}
        onClose={cerrar}
        title={
          modal?.tipo === 'medallon' ? `Regla del ${modal.item.tipo_medallon}`
            : modal?.tipo === 'seccion' ? (modal.item ? 'Editar sección' : 'Nueva sección')
            : modal?.item ? 'Editar requisito' : 'Nuevo requisito'
        }
      >
        {modal?.tipo === 'medallon' && <MedallonForm inicial={modal.item} onDone={guardado} />}
        {modal?.tipo === 'seccion' && (
          <SeccionForm inicial={modal.item} medallonId={medallonId} medallones={cat.medallones} onDone={guardado} />
        )}
        {modal?.tipo === 'requisito' && (
          <RequisitoForm
            inicial={modal.item}
            seccionInicial={modal.seccionId}
            medallonInicial={medallonId}
            medallones={cat.medallones}
            secciones={cat.secciones}
            onDone={guardado}
          />
        )}
      </Modal>
    </div>
  )
}

function useGuardar(onDone: () => void) {
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: () => Promise<unknown>) => {
    setError(null)
    try { await fn(); onDone() } catch (e) { setError(e instanceof Error ? e.message : 'Error al guardar') }
  }
  return { error, run }
}

function MedallonForm({ inicial, onDone }: { inicial: TipoMedallon; onDone: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ secciones_min: number }>({
    defaultValues: { secciones_min: inicial.secciones_min ?? 1 },
  })
  const { error, run } = useGuardar(onDone)
  return (
    <form
      onSubmit={handleSubmit((d) => run(() => api.patch(`/medallones/${inicial.id_tipo}`, { secciones_min: d.secciones_min })))}
      className="space-y-md"
    >
      <Input
        label="Mínimo de secciones a elegir"
        type="number"
        min={1}
        {...register('secciones_min', { valueAsNumber: true, required: 'Requerido', min: { value: 1, message: 'Mínimo 1' } })}
        error={errors.secciones_min?.message}
      />
      {error && <p className="text-error text-label-sm text-label-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  )
}

function SeccionForm({
  inicial, medallonId, medallones, onDone,
}: { inicial?: Seccion; medallonId: string; medallones: TipoMedallon[]; onDone: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Seccion>({
    defaultValues: inicial ?? { id_seccion: '', seccion: '', descripcion: '', medallon_id: medallonId, requisitos_min: 1 },
  })
  const { error, run } = useGuardar(onDone)

  const onSubmit = (d: Seccion) => {
    const body = { seccion: d.seccion, descripcion: d.descripcion ?? '', medallon_id: d.medallon_id, requisitos_min: d.requisitos_min }
    return run(() => (inicial ? api.patch(`/secciones/${inicial.id_seccion}`, body) : api.post('/secciones', body)))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
      <div className="space-y-xs">
        <label className={labelClass}>Medallón</label>
        <select {...register('medallon_id', { required: 'Requerido' })} className={selectClass}>
          <option value="">Seleccionar…</option>
          {medallones.map((m) => <option key={m.id_tipo} value={m.id_tipo}>{m.tipo_medallon}</option>)}
        </select>
      </div>
      <Input label="Nombre de sección" {...register('seccion', { required: 'Requerido' })} error={errors.seccion?.message} />
      <div className="space-y-xs">
        <label className={labelClass}>Descripción</label>
        <textarea {...register('descripcion')} rows={3} className={cn(selectClass, 'resize-y')} />
      </div>
      <Input
        label="Mínimo de requisitos a elegir"
        type="number"
        min={1}
        {...register('requisitos_min', { valueAsNumber: true, required: 'Requerido', min: { value: 1, message: 'Mínimo 1' } })}
        error={errors.requisitos_min?.message}
      />
      {error && <p className="text-error text-label-sm text-label-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : inicial ? 'Actualizar' : 'Crear'}</Button>
    </form>
  )
}

function RequisitoForm({
  inicial, seccionInicial, medallonInicial, medallones, secciones, onDone,
}: {
  inicial?: Requisito
  seccionInicial?: string
  medallonInicial: string
  medallones: TipoMedallon[]
  secciones: Seccion[]
  onDone: () => void
}) {
  const seccionId = inicial?.seccion_id ?? seccionInicial ?? ''
  const [medallonId, setMedallonId] = useState(
    secciones.find((s) => s.id_seccion === seccionId)?.medallon_id ?? medallonInicial,
  )
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Requisito>({
    defaultValues: inicial ?? { id_requisito: '', seccion_id: seccionId, requisito: '', referencia: '', unidad: 'distancia' },
  })
  const { error, run } = useGuardar(onDone)
  const seccionesMedallon = secciones.filter((s) => s.medallon_id === medallonId)

  const onSubmit = (d: Requisito) => {
    const body = { seccion_id: d.seccion_id, requisito: d.requisito, referencia: d.referencia, unidad: d.unidad }
    return run(() => (inicial ? api.patch(`/requisitos/${inicial.id_requisito}`, body) : api.post('/requisitos', body)))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
      <div className="grid grid-cols-2 gap-base">
        <div className="space-y-xs">
          <label className={labelClass}>Medallón</label>
          <select
            className={selectClass}
            value={medallonId}
            onChange={(e) => { setMedallonId(e.target.value); setValue('seccion_id', '') }}
          >
            {medallones.map((m) => <option key={m.id_tipo} value={m.id_tipo}>{m.tipo_medallon}</option>)}
          </select>
        </div>
        <div className="space-y-xs">
          <label className={labelClass}>Sección</label>
          <select {...register('seccion_id', { required: 'Elige una sección' })} className={selectClass}>
            <option value="">Seleccionar…</option>
            {seccionesMedallon.map((s) => <option key={s.id_seccion} value={s.id_seccion}>{s.seccion}</option>)}
          </select>
          {errors.seccion_id && <p className="text-error text-label-sm text-label-sm">{errors.seccion_id.message}</p>}
        </div>
      </div>
      <Input label="Requisito (ej. Salto alto)" {...register('requisito', { required: 'Requerido' })} error={errors.requisito?.message} />
      <div className="grid grid-cols-2 gap-base">
        <Input label="Medida de referencia" placeholder="ej. 1.50 m, 30, 15" {...register('referencia', { required: 'Requerido' })} error={errors.referencia?.message} />
        <div className="space-y-xs">
          <label className={labelClass}>Unidad</label>
          <select {...register('unidad')} className={selectClass}>
            {UNIDADES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="text-error text-label-sm text-label-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : inicial ? 'Actualizar' : 'Crear'}</Button>
    </form>
  )
}
