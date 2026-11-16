import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StateChip } from '@/components/ui/StateChip'
import { Spinner, EmptyState } from '@/components/ui/Spinner'
import { useApi } from '@/lib/hooks'
import { api } from '@/lib/api'
import { useAuth } from '@/store/authStore'
import type { AspiranteResumen, EstadoInscripcion, InscribirPayload } from '@/types/entities'
import {
  InscripcionSelector,
  erroresInscripcion,
  inscripcionVacia,
  useCatalogo,
} from './InscripcionSelector'

type EstadoFiltro = 'todos' | EstadoInscripcion

export function chipInscripcion(estado: EstadoInscripcion) {
  if (estado === 'completado') return <StateChip estado="aprobado" label="Completado" />
  if (estado === 'en_curso') return <StateChip estado="info" label="En curso" />
  return <StateChip estado="pendiente" label="Sin medallón" />
}

/** Lista de aspirantes del club, con alta de aspirante + inscripción en medallón. */
export function AspirantesPage() {
  const [busqueda, setBusqueda] = useState('')
  const [medallonFiltro, setMedallonFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos')
  const [creando, setCreando] = useState(false)

  const { data: aspirantes, loading, reload } = useApi<AspiranteResumen[]>(() => api.get('/instructor/aspirantes'))
  const catalogo = useCatalogo()

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return (aspirantes ?? [])
      .filter((a) => !q || a.aspirante.nombre.toLowerCase().includes(q))
      .filter((a) => !medallonFiltro || a.medallon?.id_tipo === medallonFiltro)
      .filter((a) => estadoFiltro === 'todos' || a.estado_inscripcion === estadoFiltro)
      .sort((a, b) => a.aspirante.nombre.localeCompare(b.aspirante.nombre))
  }, [aspirantes, busqueda, medallonFiltro, estadoFiltro])

  if (loading) return <div className="flex justify-center py-20"><Spinner size={40} /></div>

  return (
    <div className="space-y-md">
      <div className="flex flex-col gap-base md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Aspirantes</h1>
          <p className="text-body-md text-body-md text-on-surface-variant">
            Inscribe aspirantes en un medallón y registra sus pruebas de forma individual.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <span className="material-symbols-outlined text-[20px]">person_add</span> Nuevo aspirante
        </Button>
      </div>

      <GlassPanel className="grid gap-base p-base md:grid-cols-3 md:p-md">
        <Input
          label="Buscar"
          placeholder="Nombre del aspirante"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="space-y-xs">
          <label className="block text-label-md text-label-md uppercase text-on-surface-variant">Medallón</label>
          <select
            className="input-ghost w-full rounded-md bg-surface px-3 py-2.5 text-body-md text-on-surface"
            value={medallonFiltro}
            onChange={(e) => setMedallonFiltro(e.target.value)}
          >
            <option value="">Todos</option>
            {(catalogo.data?.medallones ?? []).map((m) => (
              <option key={m.id_tipo} value={m.id_tipo}>{m.tipo_medallon}</option>
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
            <option value="en_curso">En curso</option>
            <option value="completado">Completado</option>
            <option value="sin_inscripcion">Sin medallón</option>
          </select>
        </div>
      </GlassPanel>

      {!filtrados.length ? (
        <GlassPanel>
          <EmptyState icon="search" title="Sin resultados" subtitle="Ajusta los filtros o registra un nuevo aspirante." />
        </GlassPanel>
      ) : (
        <div className="space-y-base">
          {filtrados.map((a) => (
            <GlassPanel key={a.aspirante.id_usuario} className="p-sm md:p-base">
              <div className="flex flex-col gap-base md:flex-row md:items-center md:gap-gutter">
                <div className="flex flex-1 items-center gap-base">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-secondary/20 bg-secondary-container/10 font-headline-md text-headline-md text-secondary">
                    {a.aspirante.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-body-lg text-body-lg text-primary">{a.aspirante.nombre}</h3>
                    <p className="text-label-sm text-label-sm text-on-surface-variant">
                      {a.medallon?.tipo_medallon ?? 'Sin medallón'} · {a.aspirante.email}
                    </p>
                  </div>
                </div>
                <div className="min-w-40 flex-1">
                  <div className="mb-xs flex justify-between text-label-sm text-label-sm">
                    <span className="text-on-surface-variant">{a.aprobados} / {a.total_requisitos} aprobados</span>
                    <span className="text-primary-container">{a.progreso_pct}%</span>
                  </div>
                  <ProgressBar porcentaje={a.progreso_pct} colorClass={a.progreso_pct === 100 ? 'bg-tertiary-fixed-dim' : 'bg-secondary-container'} />
                </div>
                {chipInscripcion(a.estado_inscripcion)}
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

      <Modal open={creando} onClose={() => setCreando(false)} title="Nuevo aspirante" wide>
        {creando && (
          <NuevoAspiranteForm
            catalogo={catalogo}
            onCancel={() => setCreando(false)}
            onCreated={reload}
          />
        )}
      </Modal>
    </div>
  )
}

function NuevoAspiranteForm({
  catalogo,
  onCancel,
  onCreated,
}: {
  catalogo: ReturnType<typeof useCatalogo>
  onCancel: () => void
  onCreated: () => void
}) {
  const { user } = useAuth()
  const [datos, setDatos] = useState({ nombre: '', email: '', telefono: '' })
  const [plan, setPlan] = useState<InscribirPayload>(inscripcionVacia)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [creado, setCreado] = useState<{ email: string; password_temporal: string } | null>(null)

  const errores = erroresInscripcion(plan, catalogo.data)
  const datosOk = datos.nombre.trim() && /\S+@\S+\.\S+/.test(datos.email)

  const guardar = async () => {
    setError(null)
    setSaving(true)
    try {
      const res = await api.post<{ email: string; password_temporal: string }>('/usuarios', {
        nombre: datos.nombre.trim(),
        email: datos.email.trim(),
        telefono: datos.telefono.trim(),
        rol: 'aspirante',
        club_id: user?.club_id,
        inscripcion: plan,
      })
      setCreado(res)
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el aspirante')
    } finally {
      setSaving(false)
    }
  }

  if (creado) {
    return (
      <div className="space-y-md">
        <p className="text-body-md text-body-md text-on-surface">
          Aspirante creado e inscrito. Comparte estas credenciales para que pueda entrar:
        </p>
        <div className="rounded-lg border border-tertiary-container/30 bg-tertiary-container/10 p-base text-body-md text-body-md">
          <p>Correo: <strong className="text-primary">{creado.email}</strong></p>
          <p>Contraseña temporal: <strong className="font-mono text-primary">{creado.password_temporal}</strong></p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onCancel}>Listo</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-md">
      <div className="grid gap-base md:grid-cols-2">
        <Input label="Nombre" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />
        <Input label="Correo" type="email" value={datos.email} onChange={(e) => setDatos({ ...datos, email: e.target.value })} />
        <Input label="Teléfono" value={datos.telefono} onChange={(e) => setDatos({ ...datos, telefono: e.target.value })} />
      </div>

      <InscripcionSelector
        catalogo={catalogo.data}
        loading={catalogo.loading}
        value={plan}
        onChange={setPlan}
      />

      {plan.medallon_id && errores.length > 0 && (
        <ul className="list-disc space-y-xs pl-5 text-label-sm text-label-sm text-on-surface-variant">
          {errores.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      {error && <p className="text-error text-label-sm text-label-sm">{error}</p>}

      <div className="flex justify-end gap-base">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={guardar} disabled={saving || !datosOk || errores.length > 0}>
          {saving ? 'Guardando…' : 'Crear e inscribir'}
        </Button>
      </div>
    </div>
  )
}
