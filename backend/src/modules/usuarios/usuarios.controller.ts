import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { getAuth } from 'firebase-admin/auth'
import { randomUUID } from 'node:crypto'
import { db } from '../../firebase/firebase.module'
import {
  FirebaseAuthGuard,
  type AuthUser,
} from '../../common/guards/firebase-auth.guard'
import { RolesGuard, Roles } from '../../common/guards/roles.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

interface CrearUsuarioDto {
  nombre: string
  email: string
  telefono?: string
  rol: 'aspirante' | 'instructor'
  club_id: string
}

/** DTO para inscribir un aspirante en un medallón. */
interface InscribirDto {
  medallon_id: string
  secciones: string[]
  requisitos_por_seccion: Record<string, string[]>
}

/** DTO para registrar una prueba en la matriz de evaluación. */
interface RegistroPruebaDto {
  resultado: 'aprobado' | 'reprobado'
  valor: string
  fecha_logrado: string
}

@Controller('usuarios')
@UseGuards(FirebaseAuthGuard)
export class UsuariosController {
  /** GET /api/usuarios?rol=aspirante — multi-tenant: instructor solo ve su club. */
  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query('rol') rol?: string,
    @Query('club_id') clubId?: string,
  ) {
    let query: FirebaseFirestore.Query = db.collection('usuarios')
    if (rol) query = query.where('rol', '==', rol)
    if (clubId) query = query.where('club_id', '==', clubId)
    if (user.rol !== 'admin') query = query.where('club_id', '==', user.club_id)

    const snap = await query.get()
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  /** POST /api/usuarios — crea usuario en Firebase Auth + Firestore. Si es aspirante y trae inscripcion, la crea. */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  async create(
    @Body() dto: CrearUsuarioDto & { inscripcion?: InscribirDto },
    @CurrentUser() user: AuthUser,
  ) {
    if (!dto.email || !dto.nombre) throw new BadRequestException('nombre y email son obligatorios')
    if (user.rol !== 'admin' && dto.club_id !== user.club_id) {
      throw new BadRequestException('Solo puedes crear usuarios de tu propio club')
    }

    const password = randomUUID().slice(0, 12)
    const record = await getAuth().createUser({
      email: dto.email,
      password,
      displayName: dto.nombre,
    })

    const doc = {
      id_usuario: record.uid,
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono ?? '',
      rol: dto.rol,
      club_id: dto.club_id,
    }
    await db.collection('usuarios').doc(record.uid).set(doc)

    if (dto.rol === 'aspirante' && dto.inscripcion) {
      await this.inscribir(record.uid, dto.inscripcion, user)
    }

    return { ...doc, password_temporal: password }
  }

  /** POST /api/usuarios/:id/inscripcion — inscribe aspirante en medallón con secciones y requisitos. */
  @Post(':id/inscripcion')
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  async inscribirEndpoint(
    @Param('id') id: string,
    @Body() dto: InscribirDto,
    @CurrentUser() user: AuthUser,
  ) {
    const snap = await db.collection('usuarios').doc(id).get()
    if (!snap.exists) throw new NotFoundException('Aspirante no encontrado')
    const data = snap.data()
    if (data?.rol !== 'aspirante') throw new BadRequestException('Solo se pueden inscribir aspirantes')
    if (user.rol !== 'admin' && data.club_id !== user.club_id) {
      throw new BadRequestException('El aspirante no pertenece a tu club')
    }
    return this.inscribir(id, dto, user)
  }

  /** Crea/actualiza la inscripción y la matriz de evaluación del aspirante. */
  private async inscribir(aspiranteId: string, dto: InscribirDto, user: AuthUser) {
    if (!dto.medallon_id) throw new BadRequestException('medallon_id es obligatorio')
    if (!Array.isArray(dto.secciones) || !dto.secciones.length) {
      throw new BadRequestException('Debe elegir al menos una sección')
    }
    // Validar que el medallón existe y traer sus reglas
    const medSnap = await db.collection('tipo_medallon').doc(dto.medallon_id).get()
    if (!medSnap.exists) throw new NotFoundException('Medallón no encontrado')
    const med = medSnap.data() as { secciones_min?: number; requisitos_min?: number }

    const seccionesMin = med.secciones_min ?? 1
    const reqsMin = med.requisitos_min ?? 1
    if (dto.secciones.length < seccionesMin) {
      throw new BadRequestException(`Debe elegir al menos ${seccionesMin} secciones para este medallón`)
    }

    // Validar que las secciones existen y pertenecen al medallón
    const secsSnap = await db.collection('secciones').where('id_seccion', 'in', dto.secciones).get()
    const secsValidas = new Map(secsSnap.docs.map((d) => [d.id, d.data() as { medallon_id: string }]))
    for (const sid of dto.secciones) {
      const sec = secsValidas.get(sid)
      if (!sec) throw new BadRequestException(`Sección ${sid} no existe`)
      if (sec.medallon_id !== dto.medallon_id) {
        throw new BadRequestException(`La sección ${sid} no pertenece a este medallón`)
      }
    }

    // Validar requisitos por sección y construir matriz
    const matriz: Array<{
      aspirante_id: string
      requisito_id: string
      seccion_id: string
      medallon_id: string
      resultado: null
      valor: string
      fecha_logrado: string
      registrado_por: string
    }> = []
    for (const sid of dto.secciones) {
      const reqIds = dto.requisitos_por_seccion?.[sid] ?? []
      if (reqIds.length < reqsMin) {
        throw new BadRequestException(`Debe elegir al menos ${reqsMin} requisitos en cada sección`)
      }
      const reqsSnap = await db
        .collection('requisitos')
        .where('id_requisito', 'in', reqIds)
        .where('seccion_id', '==', sid)
        .get()
      if (reqsSnap.size !== reqIds.length) {
        throw new BadRequestException(`Algunos requisitos de la sección ${sid} no existen o no pertenecen a ella`)
      }
      for (const rid of reqIds) {
        matriz.push({
          aspirante_id: aspiranteId,
          requisito_id: rid,
          seccion_id: sid,
          medallon_id: dto.medallon_id,
          resultado: null,
          valor: '',
          fecha_logrado: '',
          registrado_por: user.uid,
        })
      }
    }

    const batch = db.batch()
    const inscId = `${aspiranteId}_${dto.medallon_id}`
    const inscRef = db.collection('inscripciones').doc(inscId)
    batch.set(inscRef, {
      aspirante_id: aspiranteId,
      medallon_id: dto.medallon_id,
      secciones: dto.secciones,
      fecha_inscripcion: new Date().toISOString(),
      estado: 'en_curso',
    })
    for (const m of matriz) {
      const ref = db.collection('inscripcion_requisitos').doc(`${aspiranteId}_${m.requisito_id}`)
      batch.set(ref, m)
    }
    await batch.commit()
    return { id: inscId, aspirante_id: aspiranteId, ...dto }
  }

  /** POST /api/usuarios/:id/pruebas — registra resultado en la matriz (vista requisito→aspirantes o detalle). */
  @Post(':id/pruebas')
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  async registrarPrueba(
    @Param('id') id: string,
    @Body() dto: RegistroPruebaDto & { requisito_id: string },
    @CurrentUser() user: AuthUser,
  ) {
    if (!dto.requisito_id) throw new BadRequestException('requisito_id es obligatorio')
    if (!['aprobado', 'reprobado'].includes(dto.resultado)) {
      throw new BadRequestException('resultado debe ser aprobado o reprobado')
    }
    const snap = await db.collection('usuarios').doc(id).get()
    if (!snap.exists) throw new NotFoundException('Aspirante no encontrado')
    const data = snap.data()
    if (user.rol !== 'admin' && data?.club_id !== user.club_id) {
      throw new BadRequestException('El aspirante no pertenece a tu club')
    }
    const matrizId = `${id}_${dto.requisito_id}`
    await db.collection('inscripcion_requisitos').doc(matrizId).set({
      aspirante_id: id,
      requisito_id: dto.requisito_id,
      resultado: dto.resultado,
      valor: dto.valor ?? '',
      fecha_logrado: dto.fecha_logrado ?? new Date().toISOString(),
      registrado_por: user.uid,
    }, { merge: true })
    // Also mirror to legacy pruebas collection for compatibility
    await db.collection('pruebas').doc(matrizId).set({
      aspirante_id: id,
      requisito_id: dto.requisito_id,
      resultado: dto.resultado,
      valor: dto.valor ?? '',
      fecha_logrado: dto.fecha_logrado ?? new Date().toISOString(),
      registrado_por: user.uid,
    })
    return { id: matrizId, aspirante_id: id, ...dto }
  }

  /** PATCH /api/usuarios/:id */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  async update(@Param('id') id: string, @Body() dto: Partial<CrearUsuarioDto>) {
    await db.collection('usuarios').doc(id).update({ ...dto })
    return { id, ...dto }
  }

  /** DELETE /api/usuarios/:id */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  async remove(@Param('id') id: string) {
    await db.collection('usuarios').doc(id).delete()
    return { eliminado: true }
  }

  /** GET /api/usuarios/:id/progreso */
  @Get(':id/progreso')
  async progreso(@Param('id') id: string) {
    const snap = await db.collection('progreso_aspirante').where('aspirante_id', '==', id).get()
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  /** GET /api/usuarios/:id/pruebas */
  @Get(':id/pruebas')
  async pruebas(@Param('id') id: string) {
    const snap = await db.collection('pruebas').where('aspirante_id', '==', id).get()
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }
}
