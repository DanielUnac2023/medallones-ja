import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { FirebaseAuthGuard, RolesGuard, Roles } from '../../common/guards'
import { type AuthUser } from '../../common/guards/firebase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { db } from '../../firebase/firebase.module'

interface AspiranteRow {
  id_usuario: string
  nombre: string
  email: string
  club_id: string
}

interface PruebaRow {
  aspirante_id: string
  requisito_id: string
  resultado: 'aprobado' | 'reprobado'
  valor: string
  fecha_logrado: string
}

/** Vistas agregadas para el instructor (evita N+1 en el cliente). */
@Controller('instructor')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('instructor', 'admin')
export class InstructorController {
  /** GET /api/instructor/aspirantes?q=&requisito_id=&estado= */
  @Get('aspirantes')
  async aspirantes(
    @CurrentUser() user: AuthUser,
    @Query('q') q?: string,
    @Query('requisito_id') requisitoId?: string,
    @Query('estado') estado?: 'aprobado' | 'reprobado' | 'pendiente' | 'todos',
  ) {
    const snap = await db
      .collection('usuarios')
      .where('rol', '==', 'aspirante')
      .where('club_id', '==', user.club_id)
      .get()
    const aspirantes = snap.docs.map((d) => ({ id: d.id, ...(d.data() as AspiranteRow) }))

    const reqSnap = await db.collection('requisitos').get()
    const total = reqSnap.size

    const pruebasSnap = await db.collection('pruebas').get()
    const pruebas = pruebasSnap.docs.map((d) => d.data() as PruebaRow)

    let rows = aspirantes.map((a) => {
      const mias = pruebas.filter((p) => p.aspirante_id === a.id_usuario)
      const aprobadas = mias.filter((p) => p.resultado === 'aprobado').length
      const progreso_pct = total ? Math.round((aprobadas / total) * 100) : 0
      return {
        aspirante: a,
        aprobados: aprobadas,
        total_requisitos: total,
        progreso_pct,
      }
    })

    if (q) rows = rows.filter((r) => r.aspirante.nombre.toLowerCase().includes(q.toLowerCase()))

    if (requisitoId) {
      rows = rows.filter((r) => {
        const p = pruebas.find(
          (p) => p.aspirante_id === r.aspirante.id_usuario && p.requisito_id === requisitoId,
        )
        if (!p) return estado === 'pendiente' || estado === undefined
        return p.resultado === estado || estado === 'todos'
      })
    } else if (estado && estado !== 'todos') {
      rows = rows.filter((r) => {
        const aprobadas = pruebas.filter(
          (p) => p.aspirante_id === r.aspirante.id_usuario && p.resultado === 'aprobado',
        ).length
        if (estado === 'aprobado') return aprobadas === total && total > 0
        if (estado === 'reprobado') {
          return pruebas.some(
            (p) =>
              p.aspirante_id === r.aspirante.id_usuario && p.resultado === 'reprobado',
          )
        }
        // pendiente
        return aprobadas < total
      })
    }

    return rows
  }

  /** GET /api/instructor/requisitos?aspirante_id=X */
  @Get('requisitos')
  async requisitos(@Query('aspirante_id') aspiranteId: string) {
    const [reqSnap, secSnap, medSnap, progresoSnap, pruebasSnap] = await Promise.all([
      db.collection('requisitos').get(),
      db.collection('secciones').get(),
      db.collection('tipo_medallon').get(),
      db.collection('progreso_aspirante').where('aspirante_id', '==', aspiranteId).get(),
      db.collection('pruebas').where('aspirante_id', '==', aspiranteId).get(),
    ])

    const secs = new Map(secSnap.docs.map((d) => [d.id, d.data()]))
    const meds = new Map(medSnap.docs.map((d) => [d.id, d.data()]))
    const prog = new Map(progresoSnap.docs.map((d) => [d.data().requisito_id, d.data()]))
    const pruebaMap = new Map(
      pruebasSnap.docs.map((d) => [d.data().requisito_id, d.data()]),
    )

    const items = reqSnap.docs.map((d) => {
      const r = d.data()
      const seccion = secs.get(r.seccion_id)
      const medallon = seccion ? meds.get(seccion.medallon_id) : undefined
      const prueba = pruebaMap.get(d.id)
      const progreso = prog.get(d.id)
      return {
        id_requisito: d.id,
        requisito: r,
        seccion: seccion ? { id_seccion: seccion.id, seccion: seccion.seccion } : null,
        medallon: medallon ? { id_tipo: medallon.id, tipo_medallon: medallon.tipo_medallon } : null,
        prueba: prueba
          ? {
              resultado: prueba.resultado,
              valor: prueba.valor,
              fecha_logrado: prueba.fecha_logrado,
            }
          : null,
        progreso: progreso
          ? {
              valor_registrado: progreso.valor_registrado,
              fecha_actualizado: progreso.fecha_actualizado,
            }
          : null,
      }
    })

    // agrupar por sección para la UI
    const grupos = new Map<string, { seccion: string; items: unknown[] }>()
    for (const it of items) {
      const key = it.seccion?.id_seccion ?? 'sin-seccion'
      if (!grupos.has(key)) {
        grupos.set(key, { seccion: it.seccion?.seccion ?? 'Sin sección', items: [] })
      }
      grupos.get(key)!.items.push(it)
    }
    return { items, grupos: Array.from(grupos.values()) }
  }

  /** GET /api/instructor/requisitos/:requisito_id/aspirantes — aspirantes evaluados en un requisito. */
  @Get('requisitos/:requisito_id/aspirantes')
  async aspirantesPorRequisito(
    @Param('requisito_id') requisitoId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const matrizSnap = await db
      .collection('inscripcion_requisitos')
      .where('requisito_id', '==', requisitoId)
      .get()
    const ids = [...new Set(matrizSnap.docs.map((d) => d.data().aspirante_id))]
    const users = new Map<string, string>()
    if (ids.length) {
      const uSnap = await db.collection('usuarios').where('id_usuario', 'in', ids).get()
      uSnap.forEach((d) => users.set(d.data().id_usuario, d.data().nombre))
    }
    return matrizSnap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        aspirante_id: data.aspirante_id,
        aspirante_nombre: users.get(data.aspirante_id) ?? 'Desconocido',
        resultado: data.resultado,
        valor: data.valor,
        fecha_logrado: data.fecha_logrado,
      }
    })
  }

  /** GET /api/instructor/pruebas-recientes — últimos logros desde la matriz de evaluación. */
  @Get('pruebas-recientes')
  async recientes(@CurrentUser() user: AuthUser) {
    const snap = await db
      .collection('inscripcion_requisitos')
      .where('resultado', '==', 'aprobado')
      .orderBy('fecha_logrado', 'desc')
      .limit(10)
      .get()
    const ids = [...new Set(snap.docs.map((d) => d.data().aspirante_id))]
    const reqIds = [...new Set(snap.docs.map((d) => d.data().requisito_id))]
    const users = new Map<string, string>()
    if (ids.length) {
      const uSnap = await db.collection('usuarios').where('id_usuario', 'in', ids).get()
      uSnap.forEach((d) => (users.set(d.data().id_usuario, d.data().nombre)))
    }
    const reqs = new Map<string, string>()
    if (reqIds.length) {
      const rSnap = await db.collection('requisitos').where('id_requisito', 'in', reqIds).get()
      rSnap.forEach((d) => (reqs.set(d.data().id_requisito, d.data().requisito)))
    }

    return snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        aspirante_nombre: users.get(data.aspirante_id) ?? 'Desconocido',
        requisito_nombre: reqs.get(data.requisito_id) ?? 'Desconocido',
        resultado: data.resultado,
        valor: data.valor,
        fecha_logrado: data.fecha_logrado,
      }
    })
  }
}