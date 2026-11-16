import { useState } from 'react'
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
import { formatFecha } from '@/lib/utils'
import { etiquetaUnidad, type DetalleAspirante, type InscribirPayload, type RequisitoPlan } from '@/types/entities'
import { InscripcionSelector, erroresInscripcion, inscripcionVacia, useCatalogo } from './InscripcionSelector'

/** Detalle de un aspirante: su plan (medallón → secciones → requisitos) y registro de pruebas. */
export function AspiranteDetallePage() {
  const { aspiranteId } = useParams<{ aspiranteId: string }>()
  const { data, loading, error, reload } = useApi<DetalleAspirante>(
    () => api.get(`/instructor/aspirantes/${aspiranteId}`),
    [aspiranteId],
  )
  const [seleccionado, setSeleccionado] = useState<RequisitoPlan | null>(null)
  const [editandoPlan, setEditandoPlan] = useState(false)

  if (loading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>
  if (error || !data) {
    return <GlassPanel><EmptyState icon="error" title="No se pudo cargar el aspirante" subtitle={error ?? undefined} /></GlassPanel>
  }

  const insc = data.inscripcion
  const pct = data.total ? Math.round((data.aprobados / data.total) * 100) : 0
  const enCurso = insc?.estado === 'en_curso'
  const textoPlan = enCurso ? 'Editar plan' : insc ? 'Inscribir en otro medallón' : 'Inscribir en medallón'

  return (
    <div className="space-y-lg">
      <div>
        <Link to="/aspirantes" className="text-label-md text-label-md text-secondary hover:underline">
          ← Volver a aspirantes
        </Link>
        <div className="mt-xs flex flex-col gap-base md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">{data.aspirante.nombre}</h1>
            <p className="text-body-md text-body-md text-on-surface-variant">
              {insc
                ? `${insc.medallon} · inscrito el ${formatFecha(insc.fecha_inscripcion)}`
                : 'Aún no está inscrito en un medallón'}
            </p>
          </div>
          <Button variant={enCurso ? 'secondary' : 'primary'} onClick={() => setEditandoPlan(true)}>
            <span className="material-symbols-outlined text-[20px]">{enCurso ? 'edit' : 'military_tech'}</span>
            {textoPlan}
          </Button>
        </div>
      </div>

      {insc && (
        <GlassPanel className="flex flex-col gap-base p-base md:flex-row md:items-center md:gap-gutter md:p-md">
          <div className="flex-1">
            <div className="mb-xs flex justify-between text-label-sm text-label-sm">
              <span className="text-on-surface-variant">{data.aprobados} / {data.total} requisitos aprobados</span>
              <span className="text-primary-container">{pct}%</span>
            </div>
            <ProgressBar porcentaje={pct} colorClass={pct === 100 ? 'bg-tertiary-fixed-dim' : 'bg-secondary-container'} />
          </div>
          {insc.estado === 'completado'
            ? <StateChip estado="aprobado" label={`Completado ${formatFecha(insc.fecha_completado)}`} />
            : <StateChip estado="info" label="En curso" />}
        </GlassPanel>
      )}

      {!insc ? (
        <GlassPanel>
          <EmptyState icon="military_tech" title="Sin plan" subtitle="Inscríbelo en un medallón eligiendo sus secciones y requisitos." />
        </GlassPanel>
      ) : (
        data.secciones.map((grupo) => (
          <GlassPanel key={grupo.id_seccion} accent="#e9c400" className="p-base md:p-md">
            <div className="mb-md flex items-start justify-between gap-base">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary-container">{grupo.seccion}</h2>
                {grupo.descripcion && (
                  <p className="text-label-sm text-label-sm text-on-surface-variant">{grupo.descripcion}</p>
                )}
              </div>
              <span className="shrink-0 text-label-sm text-label-sm text-on-surface-variant">
                {grupo.aprobados} / {grupo.total}
              </span>
            </div>
            <ul className="space-y-sm">
              {grupo.requisitos.map((item) => {
                const estado = estadoFromPrueba(item.resultado)
                return (
                  <li
                    key={item.id_requisito}
                    className="flex flex-col gap-base rounded-lg border border-white/5 bg-white/[0.02] p-base md:flex-row md:items-center md:gap-gutter"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-body-md text-body-md text-on-surface">{item.requisito}</p>
                      <p className="text-label-sm text-label-sm text-on-surface-variant">
                        Referencia: {item.referencia || '—'} · {etiquetaUnidad(item.unidad)}
                        {item.progreso != null && ` · Progreso del aspirante: ${item.progreso}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-base">
                      {item.resultado && (
                        <span className="text-label-sm text-label-sm text-on-surface-variant">
                          {item.valor || '—'} · {formatFecha(item.fecha_logrado)}
                        </span>
                      )}
                      <StateChip estado={estado} />
                      <Button size="sm" variant="secondary" onClick={() => setSeleccionado(item)}>
                        <span className="material-symbols-outlined text-[18px]">add_task</span>
                        {item.resultado ? 'Corregir' : 'Prueba'}
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
        {seleccionado && (
          <RegistrarPruebaForm
            requisito={seleccionado}
            aspiranteId={aspiranteId!}
            onCancel={() => setSeleccionado(null)}
            onDone={() => { setSeleccionado(null); reload() }}
          />
        )}
      </Modal>

      <Modal open={editandoPlan} onClose={() => setEditandoPlan(false)} title={textoPlan} wide>
        {editandoPlan && (
          <PlanForm
            aspiranteId={aspiranteId!}
            detalle={data}
            onCancel={() => setEditandoPlan(false)}
            onDone={() => { setEditandoPlan(false); reload() }}
          />
        )}
      </Modal>
    </div>
  )
}

function PlanForm({
  aspiranteId,
  detalle,
  onCancel,
  onDone,
}: {
  aspiranteId: string
  detalle: DetalleAspirante
  onCancel: () => void
  onDone: () => void
}) {
  const catalogo = useCatalogo()
  // Solo se edita la inscripción en curso; si está completada se empieza un medallón nuevo.
  const insc = detalle.inscripcion?.estado === 'en_curso' ? detalle.inscripcion : null
  const [plan, setPlan] = useState<InscribirPayload>(
    insc
      ? { medallon_id: insc.medallon_id, secciones: insc.secciones, requisitos_por_seccion: insc.requisitos_por_seccion }
      : inscripcionVacia,
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const aprobados = insc
    ? detalle.secciones.flatMap((s) => s.requisitos.filter((r) => r.resultado === 'aprobado').map((r) => r.id_requisito))
    : []
  const errores = erroresInscripcion(plan, catalogo.data)

  const guardar = async () => {
    setError(null)
    setSaving(true)
    try {
      await api.post(`/usuarios/${aspiranteId}/inscripcion`, plan)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-md">
      <InscripcionSelector
        catalogo={catalogo.data}
        loading={catalogo.loading}
        value={plan}
        onChange={setPlan}
        medallonBloqueado={!!insc}
        requisitosBloqueados={aprobados}
      />
      {plan.medallon_id && errores.length > 0 && (
        <ul className="list-disc space-y-xs pl-5 text-label-sm text-label-sm text-on-surface-variant">
          {errores.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      {error && <p className="text-error text-label-sm text-label-sm">{error}</p>}
      <div className="flex justify-end gap-base">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={guardar} disabled={saving || errores.length > 0}>
          {saving ? 'Guardando…' : 'Guardar plan'}
        </Button>
      </div>
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
  onCancel,
  onDone,
}: {
  requisito: RequisitoPlan
  aspiranteId: string
  onCancel: () => void
  onDone: () => void
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof pruebaSchema>>({
    resolver: zodResolver(pruebaSchema),
    defaultValues: {
      resultado: requisito.resultado ?? 'aprobado',
      valor: requisito.valor ?? '',
      fecha_logrado: (requisito.fecha_logrado || new Date().toISOString()).slice(0, 10),
    },
  })
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: z.infer<typeof pruebaSchema>) => {
    setError(null)
    try {
      await api.post(`/usuarios/${aspiranteId}/pruebas`, { requisito_id: requisito.id_requisito, ...data })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
      <p className="text-body-md text-body-md text-on-surface-variant">
        {requisito.requisito} — <span className="text-primary">{requisito.referencia}</span>
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
      <Input label={`Medición (${etiquetaUnidad(requisito.unidad)})`} placeholder="Medición" {...register('valor')} error={errors.valor?.message} />
      <Input label="Fecha" type="date" {...register('fecha_logrado')} error={errors.fecha_logrado?.message} />
      {error && <p className="text-error text-label-sm text-label-sm">{error}</p>}
      <div className="flex justify-end gap-base">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Registrar'}</Button>
      </div>
    </form>
  )
}
