// ---- Entidades normalizadas (1 por colección de Firestore) ----

export type RolNombre = 'aspirante' | 'instructor' | 'admin'

export interface Rol {
  id_rol: string
  rol: RolNombre
}

export interface Asociacion {
  id_asociacion: string
  nombre_asoc: string
}

export interface Distrito {
  id_distrito: string
  nombre_dist: string
  asoc_id: string // FK -> asociaciones
}

export interface Club {
  id_club: string
  nombre_club: string
  distrito_id: string // FK -> distritos
}

export interface TipoMedallon {
  id_tipo: string
  tipo_medallon: string
  /** Mínimo de secciones que el aspirante debe elegir (plata 3, oro 4). */
  secciones_min?: number
}

export interface Seccion {
  id_seccion: string
  seccion: string
  descripcion?: string
  medallon_id: string // FK -> tipo_medallon
  /** Mínimo de requisitos que el aspirante debe elegir dentro de la sección. */
  requisitos_min?: number
}

/** Medida de referencia del requisito. 'reps' = repeticiones. */
export type UnidadProgreso = 'distancia' | 'segundos' | 'reps'

export const UNIDADES: { value: UnidadProgreso; label: string }[] = [
  { value: 'distancia', label: 'Distancia' },
  { value: 'segundos', label: 'Segundos' },
  { value: 'reps', label: 'Repeticiones' },
]

export const etiquetaUnidad = (u?: string) => UNIDADES.find((x) => x.value === u)?.label ?? u ?? ''

export interface Requisito {
  id_requisito: string
  seccion_id: string // FK -> secciones
  requisito: string
  referencia: string
  unidad: UnidadProgreso
}

export interface Usuario {
  id_usuario: string // = UID de Firebase Auth
  nombre: string
  email: string
  telefono: string
  rol: RolNombre
  club_id: string // FK -> clubes (instructores y aspirantes)
}

export interface AspiranteClub {
  club_id: string
  aspirante_id: string // FK -> usuarios
}

export type ResultadoPrueba = 'aprobado' | 'reprobado'

export interface Prueba {
  aspirante_id: string
  requisito_id: string
  resultado: ResultadoPrueba
  valor: string // medición registrada por el instructor (ej. "1.85 m", "12 seg")
  fecha_logrado: string // ISO
  registrado_por: string // uid del instructor
}

export interface ProgresoAspirante {
  aspirante_id: string
  requisito_id: string
  valor_registrado: number
  fecha_actualizado: string // ISO
}

// ---- Inscripción y matriz de evaluación ----

export interface Inscripcion {
  id: string
  aspirante_id: string
  medallon_id: string
  secciones: string[]
  fecha_inscripcion: string
  estado: 'en_curso' | 'completado'
}

export interface InscripcionRequisito {
  id: string
  aspirante_id: string
  requisito_id: string
  seccion_id: string
  medallon_id: string
  resultado: 'aprobado' | 'reprobado' | null
  valor: string
  fecha_logrado: string
  registrado_por: string
}

// ---- Vistas agregadas (las devuelve la API) ----

/** Fila plana de GET /api/instructor/pruebas-recientes. */
export interface PruebaReciente {
  id: string
  aspirante_nombre: string
  requisito_nombre: string
  resultado: 'aprobado' | 'reprobado'
  valor: string
  fecha_logrado: string
}

export type EstadoInscripcion = 'sin_inscripcion' | 'en_curso' | 'completado'

/** Fila de GET /api/instructor/aspirantes. */
export interface AspiranteResumen {
  aspirante: Usuario
  medallon: { id_tipo: string; tipo_medallon: string } | null
  estado_inscripcion: EstadoInscripcion
  aprobados: number
  total_requisitos: number
  progreso_pct: number
}

/** Elección de medallón, secciones y requisitos que se envía al inscribir. */
export interface InscribirPayload {
  medallon_id: string
  secciones: string[]
  requisitos_por_seccion: Record<string, string[]>
}

export interface RequisitoPlan {
  id_requisito: string
  requisito: string
  referencia: string
  unidad: string
  resultado: ResultadoPrueba | null
  valor: string
  fecha_logrado: string
  progreso: number | null
}

/** GET /api/instructor/aspirantes/:id */
export interface DetalleAspirante {
  aspirante: Usuario
  inscripcion: {
    id: string
    medallon_id: string
    medallon: string
    secciones_min: number | null
    estado: 'en_curso' | 'completado'
    fecha_inscripcion: string
    fecha_completado: string
    secciones: string[]
    requisitos_por_seccion: Record<string, string[]>
  } | null
  secciones: {
    id_seccion: string
    seccion: string
    descripcion: string
    aprobados: number
    total: number
    requisitos: RequisitoPlan[]
  }[]
  aprobados: number
  total: number
}

/** GET /api/instructor/requisitos/:id/aspirantes */
export interface AspirantesDeRequisito {
  requisito: Requisito
  seccion: { id_seccion: string; seccion: string } | null
  medallon: { id_tipo: string; tipo_medallon: string } | null
  aspirantes: {
    aspirante_id: string
    aspirante_nombre: string
    resultado: ResultadoPrueba | null
    valor: string
    fecha_logrado: string
  }[]
}

export interface RequisitoConEstado {
  requisito: Requisito
  seccion: Seccion
  medallon: TipoMedallon
  prueba: Prueba | null
  progreso: ProgresoAspirante | null
}