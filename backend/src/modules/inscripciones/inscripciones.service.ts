import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { db } from '../../firebase/firebase.module'
import type { AuthUser } from '../../common/guards/firebase-auth.guard'

/** Colección de la matriz: una fila por (aspirante, requisito elegido). */
const MATRIZ = 'inscripcion_requisitos'

export type Resultado = 'aprobado' | 'reprobado'

export interface InscribirDto {
  medallon_id: string
  secciones: string[]
  requisitos_por_seccion: Record<string, string[]>
}

export interface EvaluacionDto {
  aspirante_id: string
  resultado: Resultado
  valor?: string
  fecha_logrado?: string
}

/** Plan de inscripción ya validado contra las reglas del medallón y de cada sección. */
export interface PlanInscripcion {
  medallon_id: string
  secciones: string[]
  requisitos_por_seccion: Record<string, string[]>
}

export interface InscripcionDoc {
  id: string
  aspirante_id: string
  medallon_id: string
  secciones: string[]
  requisitos_por_seccion?: Record<string, string[]>
  fecha_inscripcion: string
  fecha_completado?: string
  estado: 'en_curso' | 'completado'
}

export interface MatrizDoc {
  aspirante_id: string
  requisito_id: string
  seccion_id: string
  medallon_id: string
  resultado: Resultado | null
  valor: string
  fecha_logrado: string
  registrado_por: string
}

export interface UsuarioDoc {
  id_usuario: string
  nombre: string
  email: string
  rol: string
  club_id: string
}

/** Firestore limita `in` a 30 valores: parte la consulta en bloques. */
async function whereIn(coleccion: string, campo: string, valores: string[]) {
  const unicos = [...new Set(valores)].filter(Boolean)
  const docs: FirebaseFirestore.QueryDocumentSnapshot[] = []
  for (let i = 0; i < unicos.length; i += 30) {
    const snap = await db.collection(coleccion).where(campo, 'in', unicos.slice(i, i + 30)).get()
    docs.push(...snap.docs)
  }
  return docs
}

const unicos = (xs: string[] | undefined) => [...new Set((xs ?? []).filter(Boolean))]

/**
 * Reglas de inscripción y evaluación de aspirantes.
 * - Un aspirante va por un solo medallón a la vez.
 * - Debe elegir al menos `secciones_min` secciones del medallón y, en cada sección,
 *   al menos `requisitos_min` requisitos.
 * - Solo se evalúan requisitos que están en el plan del aspirante (la matriz).
 */
@Injectable()
export class InscripcionesService {
  /** Lee el aspirante y valida que pertenezca al club del instructor. */
  async aspiranteDelClub(id: string, user: AuthUser): Promise<UsuarioDoc> {
    const snap = await db.collection('usuarios').doc(id).get()
    if (!snap.exists) throw new NotFoundException('Aspirante no encontrado')
    const data = snap.data() as UsuarioDoc
    if (data.rol !== 'aspirante') throw new BadRequestException('El usuario no es aspirante')
    if (user.rol !== 'admin' && data.club_id !== user.club_id) {
      throw new ForbiddenException('El aspirante no pertenece a tu club')
    }
    return { ...data, id_usuario: snap.id }
  }

  /** Aspirantes del club del instructor (admin: todos). */
  async aspirantesDelClub(user: AuthUser): Promise<UsuarioDoc[]> {
    let q: FirebaseFirestore.Query = db.collection('usuarios').where('rol', '==', 'aspirante')
    if (user.rol !== 'admin') q = q.where('club_id', '==', user.club_id)
    const snap = await q.get()
    return snap.docs.map((d) => ({ ...(d.data() as UsuarioDoc), id_usuario: d.id }))
  }

  /** Inscripción en curso del aspirante (solo puede haber una). */
  async inscripcionEnCurso(aspiranteId: string): Promise<InscripcionDoc | null> {
    const snap = await db
      .collection('inscripciones')
      .where('aspirante_id', '==', aspiranteId)
      .where('estado', '==', 'en_curso')
      .get()
    const d = snap.docs[0]
    return d ? ({ id: d.id, ...d.data() } as InscripcionDoc) : null
  }

  /** Valida la elección de secciones y requisitos contra las reglas, sin escribir nada. */
  async prepararInscripcion(dto: InscribirDto): Promise<PlanInscripcion> {
    if (!dto?.medallon_id) throw new BadRequestException('Debes elegir un medallón')
    const medSnap = await db.collection('tipo_medallon').doc(dto.medallon_id).get()
    if (!medSnap.exists) throw new NotFoundException('Medallón no encontrado')
    const med = medSnap.data() as { tipo_medallon: string; secciones_min?: number }

    const secsSnap = await db.collection('secciones').where('medallon_id', '==', dto.medallon_id).get()
    const secsMedallon = new Map(
      secsSnap.docs.map((d) => [d.id, d.data() as { seccion: string; requisitos_min?: number }]),
    )

    const secciones = unicos(dto.secciones)
    const seccionesMin = Number(med.secciones_min ?? 1)
    if (secciones.length < seccionesMin) {
      throw new BadRequestException(
        `El ${med.tipo_medallon} exige elegir al menos ${seccionesMin} secciones (elegiste ${secciones.length})`,
      )
    }
    for (const sid of secciones) {
      if (!secsMedallon.has(sid)) {
        throw new BadRequestException(`La sección ${sid} no existe o no pertenece a este medallón`)
      }
    }

    const reqsPorSec = await Promise.all(
      secciones.map((sid) => db.collection('requisitos').where('seccion_id', '==', sid).get()),
    )
    const requisitos_por_seccion: Record<string, string[]> = {}
    secciones.forEach((sid, i) => {
      const sec = secsMedallon.get(sid)!
      const validos = new Set(reqsPorSec[i].docs.map((d) => d.id))
      const elegidos = unicos(dto.requisitos_por_seccion?.[sid])
      const min = Number(sec.requisitos_min ?? 1)
      if (elegidos.length < min) {
        throw new BadRequestException(
          `En la sección "${sec.seccion}" debes elegir al menos ${min} requisitos (elegiste ${elegidos.length})`,
        )
      }
      for (const rid of elegidos) {
        if (!validos.has(rid)) {
          throw new BadRequestException(`El requisito ${rid} no pertenece a la sección "${sec.seccion}"`)
        }
      }
      requisitos_por_seccion[sid] = elegidos
    })

    return { medallon_id: dto.medallon_id, secciones, requisitos_por_seccion }
  }

  /**
   * Inscribe (o modifica la inscripción de) un aspirante existente.
   * Si ya va por otro medallón, se rechaza. Si es el mismo medallón, se actualiza la
   * elección conservando los resultados de los requisitos que siguen elegidos.
   */
  async inscribir(aspiranteId: string, dto: InscribirDto, user: AuthUser) {
    const aspirante = await this.aspiranteDelClub(aspiranteId, user)

    const actual = await this.inscripcionEnCurso(aspiranteId)
    if (actual && actual.medallon_id !== dto.medallon_id) {
      const med = await db.collection('tipo_medallon').doc(actual.medallon_id).get()
      throw new ConflictException(
        `El aspirante ya va por el ${med.data()?.tipo_medallon ?? actual.medallon_id}. Solo puede ir por un medallón a la vez.`,
      )
    }
    const previa = await db.collection('inscripciones').doc(`${aspiranteId}_${dto.medallon_id}`).get()
    if (previa.exists && previa.data()?.estado === 'completado') {
      throw new ConflictException('El aspirante ya completó este medallón')
    }

    const plan = await this.prepararInscripcion(dto)
    return this.guardarInscripcion(aspiranteId, aspirante.club_id, plan, user)
  }

  /** Escribe la inscripción y su matriz. Supone el plan ya validado. */
  async guardarInscripcion(aspiranteId: string, clubId: string, plan: PlanInscripcion, user: AuthUser) {
    const elegidos = new Map<string, string>() // requisito -> sección
    for (const sid of plan.secciones) {
      for (const rid of plan.requisitos_por_seccion[sid]) elegidos.set(rid, sid)
    }

    const existentesSnap = await db
      .collection(MATRIZ)
      .where('aspirante_id', '==', aspiranteId)
      .where('medallon_id', '==', plan.medallon_id)
      .get()
    const existentes = new Map(existentesSnap.docs.map((d) => [d.data().requisito_id as string, d]))

    const batch = db.batch()
    for (const [rid, doc] of existentes) {
      if (elegidos.has(rid)) continue
      if (doc.data().resultado === 'aprobado') {
        throw new BadRequestException(`No puedes quitar el requisito ${rid}: ya está aprobado`)
      }
      batch.delete(doc.ref)
    }
    for (const [rid, sid] of elegidos) {
      if (existentes.has(rid)) continue
      const fila: MatrizDoc = {
        aspirante_id: aspiranteId,
        requisito_id: rid,
        seccion_id: sid,
        medallon_id: plan.medallon_id,
        resultado: null,
        valor: '',
        fecha_logrado: '',
        registrado_por: '',
      }
      batch.set(db.collection(MATRIZ).doc(`${aspiranteId}_${rid}`), fila)
    }

    const inscId = `${aspiranteId}_${plan.medallon_id}`
    const inscRef = db.collection('inscripciones').doc(inscId)
    const previa = await inscRef.get()
    batch.set(inscRef, {
      aspirante_id: aspiranteId,
      medallon_id: plan.medallon_id,
      club_id: clubId,
      secciones: plan.secciones,
      requisitos_por_seccion: plan.requisitos_por_seccion,
      fecha_inscripcion: previa.data()?.fecha_inscripcion ?? new Date().toISOString(),
      estado: 'en_curso',
      inscrito_por: user.uid,
    })
    await batch.commit()
    await this.recalcularEstado(aspiranteId, plan.medallon_id)
    return { id: inscId, aspirante_id: aspiranteId, ...plan }
  }

  /**
   * Registra el resultado de un requisito para uno o varios aspirantes (evaluación
   * individual o grupal). Cada aspirante debe tener el requisito en su plan.
   */
  async registrarEvaluaciones(
    requisitoId: string,
    evaluaciones: EvaluacionDto[],
    user: AuthUser,
  ) {
    if (!requisitoId) throw new BadRequestException('requisito_id es obligatorio')
    if (!Array.isArray(evaluaciones) || !evaluaciones.length) {
      throw new BadRequestException('No hay evaluaciones para registrar')
    }
    const ahora = new Date().toISOString()
    const batch = db.batch()
    const afectados = new Map<string, string>() // aspirante -> medallón

    for (const ev of evaluaciones) {
      if (!['aprobado', 'reprobado'].includes(ev.resultado)) {
        throw new BadRequestException('resultado debe ser aprobado o reprobado')
      }
      const aspirante = await this.aspiranteDelClub(ev.aspirante_id, user)
      const ref = db.collection(MATRIZ).doc(`${ev.aspirante_id}_${requisitoId}`)
      const fila = await ref.get()
      if (!fila.exists) {
        throw new BadRequestException(`${aspirante.nombre} no tiene este requisito en su plan`)
      }
      const datos = {
        resultado: ev.resultado,
        valor: ev.valor ?? '',
        fecha_logrado: ev.fecha_logrado || ahora,
        registrado_por: user.uid,
        actualizado_el: ahora,
      }
      batch.update(ref, datos)
      // Compatibilidad: la vista "Mis logros" del aspirante lee la colección pruebas.
      batch.set(db.collection('pruebas').doc(`${ev.aspirante_id}_${requisitoId}`), {
        aspirante_id: ev.aspirante_id,
        requisito_id: requisitoId,
        ...datos,
      })
      afectados.set(ev.aspirante_id, fila.data()!.medallon_id)
    }
    await batch.commit()
    await Promise.all([...afectados].map(([a, m]) => this.recalcularEstado(a, m)))
    return { registradas: evaluaciones.length }
  }

  /** Marca la inscripción como completada cuando todos sus requisitos están aprobados. */
  async recalcularEstado(aspiranteId: string, medallonId: string) {
    const ref = db.collection('inscripciones').doc(`${aspiranteId}_${medallonId}`)
    const insc = await ref.get()
    if (!insc.exists) return
    const filas = await db
      .collection(MATRIZ)
      .where('aspirante_id', '==', aspiranteId)
      .where('medallon_id', '==', medallonId)
      .get()
    const completo = filas.size > 0 && filas.docs.every((d) => d.data().resultado === 'aprobado')
    const estado = completo ? 'completado' : 'en_curso'
    if (insc.data()?.estado !== estado) {
      await ref.update({ estado, fecha_completado: completo ? new Date().toISOString() : '' })
    }
  }

  /** Detalle del aspirante: inscripción actual y su plan agrupado por sección. */
  async detalleAspirante(aspiranteId: string, user: AuthUser) {
    const aspirante = await this.aspiranteDelClub(aspiranteId, user)

    const inscSnap = await db.collection('inscripciones').where('aspirante_id', '==', aspiranteId).get()
    const inscripciones = inscSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as InscripcionDoc)
    const actual =
      inscripciones.find((i) => i.estado === 'en_curso') ??
      inscripciones.sort((a, b) => (b.fecha_inscripcion ?? '').localeCompare(a.fecha_inscripcion ?? ''))[0]

    if (!actual) return { aspirante, inscripcion: null, secciones: [], aprobados: 0, total: 0 }

    const [medSnap, matrizSnap, progresoSnap] = await Promise.all([
      db.collection('tipo_medallon').doc(actual.medallon_id).get(),
      db
        .collection(MATRIZ)
        .where('aspirante_id', '==', aspiranteId)
        .where('medallon_id', '==', actual.medallon_id)
        .get(),
      db.collection('progreso_aspirante').where('aspirante_id', '==', aspiranteId).get(),
    ])
    const filas = matrizSnap.docs.map((d) => d.data() as MatrizDoc)
    const progreso = new Map(progresoSnap.docs.map((d) => [d.data().requisito_id, d.data().valor_registrado]))

    const [reqDocs, secDocs] = await Promise.all([
      Promise.all(filas.map((f) => db.collection('requisitos').doc(f.requisito_id).get())),
      Promise.all(unicos(filas.map((f) => f.seccion_id)).map((s) => db.collection('secciones').doc(s).get())),
    ])
    const reqs = new Map(reqDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]))
    const secs = new Map(secDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]))

    const orden = actual.secciones?.length ? actual.secciones : [...secs.keys()]
    const secciones = orden.map((sid) => {
      const sec = secs.get(sid)
      const items = filas
        .filter((f) => f.seccion_id === sid)
        .map((f) => {
          const r = reqs.get(f.requisito_id)
          return {
            id_requisito: f.requisito_id,
            requisito: r?.requisito ?? f.requisito_id,
            referencia: r?.referencia ?? '',
            unidad: r?.unidad ?? '',
            resultado: f.resultado,
            valor: f.valor,
            fecha_logrado: f.fecha_logrado,
            progreso: progreso.get(f.requisito_id) ?? null,
          }
        })
      return {
        id_seccion: sid,
        seccion: sec?.seccion ?? sid,
        descripcion: sec?.descripcion ?? '',
        aprobados: items.filter((i) => i.resultado === 'aprobado').length,
        total: items.length,
        requisitos: items,
      }
    })

    const med = medSnap.data()
    return {
      aspirante,
      inscripcion: {
        id: actual.id,
        medallon_id: actual.medallon_id,
        medallon: med?.tipo_medallon ?? actual.medallon_id,
        secciones_min: med?.secciones_min ?? null,
        estado: actual.estado,
        fecha_inscripcion: actual.fecha_inscripcion,
        fecha_completado: actual.fecha_completado ?? '',
        secciones: actual.secciones,
        requisitos_por_seccion: actual.requisitos_por_seccion ?? {},
      },
      secciones,
      aprobados: filas.filter((f) => f.resultado === 'aprobado').length,
      total: filas.length,
    }
  }

  /** Resumen de cada aspirante del club: medallón actual y avance. */
  async resumenAspirantes(user: AuthUser) {
    const aspirantes = await this.aspirantesDelClub(user)
    const ids = aspirantes.map((a) => a.id_usuario)
    const [inscDocs, matrizDocs, medSnap] = await Promise.all([
      whereIn('inscripciones', 'aspirante_id', ids),
      whereIn(MATRIZ, 'aspirante_id', ids),
      db.collection('tipo_medallon').get(),
    ])
    const meds = new Map(medSnap.docs.map((d) => [d.id, d.data().tipo_medallon as string]))
    const inscs = inscDocs.map((d) => ({ id: d.id, ...d.data() }) as InscripcionDoc)
    const filas = matrizDocs.map((d) => d.data() as MatrizDoc)

    return aspirantes.map((a) => {
      const propias = inscs.filter((i) => i.aspirante_id === a.id_usuario)
      const actual =
        propias.find((i) => i.estado === 'en_curso') ??
        propias.sort((x, y) => (y.fecha_inscripcion ?? '').localeCompare(x.fecha_inscripcion ?? ''))[0]
      const mias = actual
        ? filas.filter((f) => f.aspirante_id === a.id_usuario && f.medallon_id === actual.medallon_id)
        : []
      const aprobados = mias.filter((f) => f.resultado === 'aprobado').length
      return {
        aspirante: a,
        medallon: actual ? { id_tipo: actual.medallon_id, tipo_medallon: meds.get(actual.medallon_id) ?? '' } : null,
        estado_inscripcion: actual?.estado ?? 'sin_inscripcion',
        aprobados,
        total_requisitos: mias.length,
        progreso_pct: mias.length ? Math.round((aprobados / mias.length) * 100) : 0,
      }
    })
  }

  /** Aspirantes del club que tienen un requisito en su plan, con su resultado. */
  async aspirantesPorRequisito(requisitoId: string, user: AuthUser) {
    const reqSnap = await db.collection('requisitos').doc(requisitoId).get()
    if (!reqSnap.exists) throw new NotFoundException('Requisito no encontrado')
    const req = reqSnap.data()!
    const secSnap = await db.collection('secciones').doc(req.seccion_id).get()
    const sec = secSnap.data()
    const medSnap = sec ? await db.collection('tipo_medallon').doc(sec.medallon_id).get() : null

    const [matrizSnap, aspirantes] = await Promise.all([
      db.collection(MATRIZ).where('requisito_id', '==', requisitoId).get(),
      this.aspirantesDelClub(user),
    ])
    const delClub = new Map(aspirantes.map((a) => [a.id_usuario, a]))
    const filas = matrizSnap.docs
      .map((d) => d.data() as MatrizDoc)
      .filter((f) => delClub.has(f.aspirante_id))
      .map((f) => ({
        aspirante_id: f.aspirante_id,
        aspirante_nombre: delClub.get(f.aspirante_id)!.nombre,
        resultado: f.resultado,
        valor: f.valor,
        fecha_logrado: f.fecha_logrado,
      }))
      .sort((a, b) => a.aspirante_nombre.localeCompare(b.aspirante_nombre))

    return {
      requisito: { id_requisito: reqSnap.id, ...req },
      seccion: sec ? { id_seccion: secSnap.id, seccion: sec.seccion } : null,
      medallon: medSnap?.exists ? { id_tipo: medSnap.id, tipo_medallon: medSnap.data()!.tipo_medallon } : null,
      aspirantes: filas,
    }
  }

  /** Últimos requisitos aprobados en el club. */
  async recientes(user: AuthUser) {
    const aspirantes = await this.aspirantesDelClub(user)
    const nombres = new Map(aspirantes.map((a) => [a.id_usuario, a.nombre]))
    const snap = await db.collection(MATRIZ).where('resultado', '==', 'aprobado').get()
    const filas = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as MatrizDoc) }))
      .filter((f) => nombres.has(f.aspirante_id))
      .sort((a, b) => (b.fecha_logrado ?? '').localeCompare(a.fecha_logrado ?? ''))
      .slice(0, 10)
    const reqDocs = await Promise.all(
      unicos(filas.map((f) => f.requisito_id)).map((r) => db.collection('requisitos').doc(r).get()),
    )
    const reqs = new Map(reqDocs.map((d) => [d.id, d.data()?.requisito as string | undefined]))
    return filas.map((f) => ({
      id: f.id,
      aspirante_nombre: nombres.get(f.aspirante_id) ?? 'Desconocido',
      requisito_nombre: reqs.get(f.requisito_id) ?? 'Desconocido',
      resultado: f.resultado,
      valor: f.valor,
      fecha_logrado: f.fecha_logrado,
    }))
  }
}
