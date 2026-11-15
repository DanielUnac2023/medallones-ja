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
  secciones_min?: number
  requisitos_min?: number
}

export interface Seccion {
  id_seccion: string
  seccion: string
  medallon_id: string // FK -> tipo_medallon
}

export type UnidadProgreso = 'reps' | 'segundos'

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

export interface AspiranteResumen {
  aspirante: Usuario
  aprobados: number
  total_requisitos: number
  progreso_pct: number
}

export interface RequisitoConEstado {
  requisito: Requisito
  seccion: Seccion
  medallon: TipoMedallon
  prueba: Prueba | null
  progreso: ProgresoAspirante | null
}