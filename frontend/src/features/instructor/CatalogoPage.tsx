import { useState } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner, EmptyState } from '@/components/ui/Spinner'
import { useApi } from '@/lib/hooks'
import { api } from '@/lib/api'
import type { Asociacion, Club, Distrito, TipoMedallon } from '@/types/entities'

type Tab = 'asociaciones' | 'distritos' | 'clubes' | 'medallones'

const tabs: { id: Tab; label: string }[] = [
  { id: 'asociaciones', label: 'Asociaciones' },
  { id: 'distritos', label: 'Distritos' },
  { id: 'clubes', label: 'Clubes' },
  { id: 'medallones', label: 'Medallones' },
]

/** Catálogo de asociaciones, distritos, clubes y tipos de medallón (CRUD). */
export function CatalogoPage() {
  const [tab, setTab] = useState<Tab>('asociaciones')

  const asociaciones = useApi<Asociacion[]>(() => api.get('/asociaciones'), [tab])
  const distritos = useApi<Distrito[]>(() => api.get('/distritos'), [tab])
  const clubes = useApi<Club[]>(() => api.get('/clubes'), [tab])
  const medallones = useApi<TipoMedallon[]>(() => api.get('/medallones'), [tab])

  return (
    <div className="space-y-md">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Catálogo</h1>
        <p className="text-body-md text-body-md text-on-surface-variant">
          Estructura jerárquica: asociación → distrito → club, y tipos de medallón.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-base">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-label-md text-label-md transition-all ${
              tab === t.id
                ? 'bg-primary-container text-on-primary-container'
                : 'border border-white/10 bg-white/5 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'asociaciones' && (
        <EntityTable
          data={asociaciones.data ?? []}
          loading={asociaciones.loading}
          columns={[{ key: 'nombre_asoc', label: 'Asociación' }]}
          onSaved={asociaciones.reload}
          endpoint="/asociaciones"
          field="nombre_asoc"
          empty="Sin asociaciones"
        />
      )}
      {tab === 'distritos' && (
        <EntityTable
          data={distritos.data ?? []}
          loading={distritos.loading}
          columns={[{ key: 'nombre_dist', label: 'Distrito' }]}
          onSaved={distritos.reload}
          endpoint="/distritos"
          field="nombre_dist"
          empty="Sin distritos"
          extraFields={
            <div className="space-y-xs">
              <label className="block text-label-md text-label-md uppercase text-on-surface-variant">Asociación</label>
              <select name="asoc_id" className="input-ghost w-full rounded-md bg-surface px-3 py-2.5 text-body-md text-on-surface">
                <option value="">Seleccionar…</option>
                {(asociaciones.data ?? []).map((a) => (
                  <option key={a.id_asociacion} value={a.id_asociacion}>{a.nombre_asoc}</option>
                ))}
              </select>
            </div>
          }
        />
      )}
      {tab === 'clubes' && (
        <EntityTable
          data={clubes.data ?? []}
          loading={clubes.loading}
          columns={[{ key: 'nombre_club', label: 'Club' }]}
          onSaved={clubes.reload}
          endpoint="/clubes"
          field="nombre_club"
          empty="Sin clubes"
          extraFields={
            <div className="space-y-xs">
              <label className="block text-label-md text-label-md uppercase text-on-surface-variant">Distrito</label>
              <select name="distrito_id" className="input-ghost w-full rounded-md bg-surface px-3 py-2.5 text-body-md text-on-surface">
                <option value="">Seleccionar…</option>
                {(distritos.data ?? []).map((d) => (
                  <option key={d.id_distrito} value={d.id_distrito}>{d.nombre_dist}</option>
                ))}
              </select>
            </div>
          }
        />
      )}
      {tab === 'medallones' && (
        <EntityTable
          data={medallones.data ?? []}
          loading={medallones.loading}
          columns={[{ key: 'tipo_medallon', label: 'Medallón' }]}
          onSaved={medallones.reload}
          endpoint="/medallones"
          field="tipo_medallon"
          empty="Sin medallones"
        />
      )}
    </div>
  )
}

interface EntityTableProps<T> {
  data: T[]
  loading: boolean
  columns: { key: keyof T; label: string }[]
  endpoint: string
  field: string
  onSaved: () => void
  empty: string
  extraFields?: React.ReactNode
}

/** Tabla genérica con creación y borrado para catálogos simples. */
function EntityTable<T extends object>({
  data, loading, columns, endpoint, field, onSaved, empty, extraFields,
}: EntityTableProps<T>) {
  const [creando, setCreando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)

  const crear = async () => {
    if (!nombre.trim()) return
    setSaving(true)
    try {
      await api.post(endpoint, { [field]: nombre.trim(), ...collectExtras() })
      setNombre('')
      setCreando(false)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (item: T) => {
    const rec = item as Record<string, unknown>
    const idKey = Object.keys(rec).find((k) => k.endsWith('_id') || k === 'id') ?? 'id'
    if (!window.confirm('¿Eliminar este registro?')) return
    await api.del(`${endpoint}/${rec[idKey]}`)
    onSaved()
  }

  // Recolecta los selects extra del formulario (asoc_id, distrito_id...)
  function collectExtras(): Record<string, string> {
    const out: Record<string, string> = {}
    document.querySelectorAll<HTMLSelectElement>('select[name]').forEach((s) => {
      if (s.value) out[s.name] = s.value
    })
    return out
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size={32} /></div>

  return (
    <GlassPanel className="p-base md:p-md">
      <div className="mb-md flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md text-primary capitalize">{empty.replace('Sin ', '')}</h2>
        <Button size="sm" onClick={() => setCreando((v) => !v)}>
          <span className="material-symbols-outlined text-[18px]">{creando ? 'close' : 'add'}</span>
          {creando ? 'Cancelar' : 'Nuevo'}
        </Button>
      </div>

      {creando && (
        <div className="mb-md flex flex-col gap-base rounded-lg border border-white/10 bg-white/[0.02] p-base md:flex-row md:items-end">
          <div className="flex-1">
            <Input label={columns[0]?.label ?? 'Nombre'} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={`Nuevo ${field.replace('_', ' ')}`} />
          </div>
          {extraFields && <div className="flex-1">{extraFields}</div>}
          <Button onClick={crear} disabled={saving || !nombre.trim()}>{saving ? 'Guardando…' : 'Crear'}</Button>
        </div>
      )}

      {!data.length ? (
        <EmptyState icon="folder_off" title={empty} />
      ) : (
        <ul className="divide-y divide-white/5">
          {data.map((item) => {
            const rec = item as Record<string, unknown>
            const idKey = Object.keys(rec).find((k) => k.endsWith('_id') || k === 'id') ?? 'id'
            return (
              <li key={String(rec[idKey])} className="flex items-center justify-between py-sm">
                <div className="flex flex-wrap gap-base">
                  {columns.map((c) => (
                    <span key={String(c.key)} className="text-body-md text-body-md text-on-surface">
                      {String(rec[c.key as keyof typeof rec] ?? '—')}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => eliminar(item)}
                  aria-label="Eliminar"
                  className="rounded-md p-2 text-on-surface-variant transition-all hover:bg-error-container/20 hover:text-error"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </GlassPanel>
  )
}