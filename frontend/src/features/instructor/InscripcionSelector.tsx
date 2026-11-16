import { useMemo } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/lib/hooks'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  etiquetaUnidad,
  type InscribirPayload,
  type Requisito,
  type Seccion,
  type TipoMedallon,
} from '@/types/entities'

export interface Catalogo {
  medallones: TipoMedallon[]
  secciones: Seccion[]
  requisitos: Requisito[]
}

/** Carga medallones, secciones y requisitos (los tres catálogos que usa la inscripción). */
export function useCatalogo() {
  return useApi<Catalogo>(async () => {
    const [medallones, secciones, requisitos] = await Promise.all([
      api.get<TipoMedallon[]>('/medallones'),
      api.get<Seccion[]>('/secciones'),
      api.get<Requisito[]>('/requisitos'),
    ])
    return { medallones, secciones, requisitos }
  })
}

export const inscripcionVacia: InscribirPayload = { medallon_id: '', secciones: [], requisitos_por_seccion: {} }

/** Errores de la elección según las reglas del medallón y de cada sección (vacío = válida). */
export function erroresInscripcion(v: InscribirPayload, cat: Catalogo | null): string[] {
  if (!cat) return ['Cargando catálogo…']
  if (!v.medallon_id) return ['Elige un medallón']
  const med = cat.medallones.find((m) => m.id_tipo === v.medallon_id)
  const errores: string[] = []
  const min = Number(med?.secciones_min ?? 1)
  if (v.secciones.length < min) {
    errores.push(`Elige al menos ${min} secciones (llevas ${v.secciones.length})`)
  }
  for (const sid of v.secciones) {
    const sec = cat.secciones.find((s) => s.id_seccion === sid)
    const minReq = Number(sec?.requisitos_min ?? 1)
    const elegidos = v.requisitos_por_seccion[sid]?.length ?? 0
    if (elegidos < minReq) {
      errores.push(`${sec?.seccion ?? sid}: elige al menos ${minReq} requisitos (llevas ${elegidos})`)
    }
  }
  return errores
}

/**
 * Selector del plan del aspirante: medallón → secciones (mínimo del medallón) →
 * requisitos de cada sección (mínimo de la sección).
 */
export function InscripcionSelector({
  catalogo,
  loading,
  value,
  onChange,
  medallonBloqueado,
  requisitosBloqueados = [],
}: {
  catalogo: Catalogo | null
  loading: boolean
  value: InscribirPayload
  onChange: (v: InscribirPayload) => void
  /** Si el aspirante ya va por un medallón, no se puede cambiar. */
  medallonBloqueado?: boolean
  /** Requisitos ya aprobados: no se pueden quitar del plan. */
  requisitosBloqueados?: string[]
}) {
  const seccionesMedallon = useMemo(
    () => (catalogo?.secciones ?? []).filter((s) => s.medallon_id === value.medallon_id),
    [catalogo, value.medallon_id],
  )

  if (loading || !catalogo) return <div className="flex justify-center py-8"><Spinner size={28} /></div>

  const med = catalogo.medallones.find((m) => m.id_tipo === value.medallon_id)
  const minSecciones = Number(med?.secciones_min ?? 1)
  const bloqueados = new Set(requisitosBloqueados)

  const toggleSeccion = (sid: string) => {
    const activa = value.secciones.includes(sid)
    if (activa && (value.requisitos_por_seccion[sid] ?? []).some((r) => bloqueados.has(r))) return
    const secciones = activa ? value.secciones.filter((s) => s !== sid) : [...value.secciones, sid]
    const requisitos_por_seccion = { ...value.requisitos_por_seccion }
    if (activa) delete requisitos_por_seccion[sid]
    else requisitos_por_seccion[sid] = []
    onChange({ ...value, secciones, requisitos_por_seccion })
  }

  const toggleRequisito = (sid: string, rid: string) => {
    if (bloqueados.has(rid)) return
    const actuales = value.requisitos_por_seccion[sid] ?? []
    const nuevos = actuales.includes(rid) ? actuales.filter((r) => r !== rid) : [...actuales, rid]
    onChange({ ...value, requisitos_por_seccion: { ...value.requisitos_por_seccion, [sid]: nuevos } })
  }

  return (
    <div className="space-y-md">
      <div className="space-y-xs">
        <label className="block text-label-md text-label-md uppercase text-on-surface-variant">Medallón</label>
        <div className="grid grid-cols-2 gap-base">
          {catalogo.medallones.map((m) => {
            const activo = m.id_tipo === value.medallon_id
            return (
              <button
                key={m.id_tipo}
                type="button"
                disabled={medallonBloqueado && !activo}
                onClick={() => onChange({ ...inscripcionVacia, medallon_id: m.id_tipo })}
                className={cn(
                  'rounded-lg border p-base text-left transition-all disabled:opacity-40',
                  activo
                    ? 'border-primary-container bg-primary-container/15 text-primary'
                    : 'border-white/10 bg-white/[0.02] text-on-surface hover:bg-white/5',
                )}
              >
                <p className="text-body-md text-body-md">{m.tipo_medallon}</p>
                <p className="text-label-sm text-label-sm text-on-surface-variant">
                  Mínimo {m.secciones_min ?? 1} secciones
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {value.medallon_id && (
        <div className="space-y-sm">
          <div className="flex items-baseline justify-between">
            <label className="block text-label-md text-label-md uppercase text-on-surface-variant">Secciones</label>
            <span
              className={cn(
                'text-label-sm text-label-sm',
                value.secciones.length >= minSecciones ? 'text-tertiary-fixed' : 'text-on-surface-variant',
              )}
            >
              {value.secciones.length} de {seccionesMedallon.length} · mínimo {minSecciones}
            </span>
          </div>

          {!seccionesMedallon.length && (
            <p className="text-label-sm text-label-sm text-on-surface-variant">
              Este medallón aún no tiene secciones. Créalas en Requisitos.
            </p>
          )}

          {seccionesMedallon.map((s) => {
            const activa = value.secciones.includes(s.id_seccion)
            const reqs = catalogo.requisitos.filter((r) => r.seccion_id === s.id_seccion)
            const elegidos = value.requisitos_por_seccion[s.id_seccion] ?? []
            const minReq = Number(s.requisitos_min ?? 1)
            return (
              <div
                key={s.id_seccion}
                className={cn(
                  'rounded-lg border p-base transition-all',
                  activa ? 'border-primary-container/50 bg-primary-container/5' : 'border-white/10 bg-white/[0.02]',
                )}
              >
                <label className="flex cursor-pointer items-start gap-sm">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[#ffd700]"
                    checked={activa}
                    onChange={() => toggleSeccion(s.id_seccion)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-body-md text-body-md text-on-surface">{s.seccion}</span>
                    {s.descripcion && (
                      <span className="block text-label-sm text-label-sm text-on-surface-variant">{s.descripcion}</span>
                    )}
                  </span>
                  {activa && (
                    <span
                      className={cn(
                        'shrink-0 text-label-sm text-label-sm',
                        elegidos.length >= minReq ? 'text-tertiary-fixed' : 'text-on-surface-variant',
                      )}
                    >
                      {elegidos.length} de {reqs.length} · mín. {minReq}
                    </span>
                  )}
                </label>

                {activa && (
                  <ul className="mt-sm space-y-xs border-t border-white/5 pt-sm pl-6">
                    {reqs.map((r) => (
                      <li key={r.id_requisito}>
                        <label className="flex cursor-pointer items-center gap-sm">
                          <input
                            type="checkbox"
                            className="accent-[#ffd700]"
                            checked={elegidos.includes(r.id_requisito)}
                            disabled={bloqueados.has(r.id_requisito)}
                            onChange={() => toggleRequisito(s.id_seccion, r.id_requisito)}
                          />
                          <span className="flex-1 text-body-md text-body-md text-on-surface">{r.requisito}</span>
                          <span className="text-label-sm text-label-sm text-on-surface-variant">
                            {r.referencia} · {etiquetaUnidad(r.unidad)}
                          </span>
                          {bloqueados.has(r.id_requisito) && (
                            <span className="text-label-sm text-label-sm text-tertiary-fixed">Aprobado</span>
                          )}
                        </label>
                      </li>
                    ))}
                    {!reqs.length && (
                      <li className="text-label-sm text-label-sm text-on-surface-variant">Sin requisitos en esta sección.</li>
                    )}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
