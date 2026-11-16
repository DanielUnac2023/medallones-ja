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
  ConflictException,
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
import {
  InscripcionesService,
  type InscribirDto,
  type Resultado,
} from '../inscripciones/inscripciones.service'

interface CrearUsuarioDto {
  nombre: string
  email: string
  telefono?: string
  rol: 'aspirante' | 'instructor'
  club_id: string
}

/** DTO para registrar una prueba en la matriz de evaluación. */
interface RegistroPruebaDto {
  requisito_id: string
  resultado: Resultado
  valor: string
  fecha_logrado: string
}

@Controller('usuarios')
@UseGuards(FirebaseAuthGuard)
export class UsuariosController {
  constructor(private readonly inscripciones: InscripcionesService) {}

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

  /**
   * POST /api/usuarios — crea usuario en Firebase Auth + Firestore.
   * Un aspirante debe llegar con su inscripción (medallón, secciones y requisitos);
   * se valida antes de crear la cuenta para no dejar aspirantes sin plan.
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  async create(
    @Body() dto: CrearUsuarioDto & { inscripcion?: InscribirDto },
    @CurrentUser() user: AuthUser,
  ) {
    if (!dto.email || !dto.nombre) throw new BadRequestException('nombre y email son obligatorios')
    if (!['aspirante', 'instructor'].includes(dto.rol)) throw new BadRequestException('rol inválido')
    const clubId = user.rol === 'admin' ? dto.club_id : user.club_id
    if (user.rol !== 'admin' && dto.club_id && dto.club_id !== user.club_id) {
      throw new BadRequestException('Solo puedes crear usuarios de tu propio club')
    }
    if (dto.rol === 'aspirante' && !dto.inscripcion) {
      throw new BadRequestException('Un aspirante nuevo debe inscribirse en un medallón')
    }

    const plan =
      dto.rol === 'aspirante' ? await this.inscripciones.prepararInscripcion(dto.inscripcion!) : null

    const password = randomUUID().slice(0, 12)
    let record
    try {
      record = await getAuth().createUser({
        email: dto.email,
        password,
        displayName: dto.nombre,
      })
    } catch (e) {
      if ((e as { code?: string }).code === 'auth/email-already-exists') {
        throw new ConflictException('Ya existe un usuario con ese correo')
      }
      throw e
    }

    const doc = {
      id_usuario: record.uid,
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono ?? '',
      rol: dto.rol,
      club_id: clubId,
    }
    await db.collection('usuarios').doc(record.uid).set(doc)

    if (plan) await this.inscripciones.guardarInscripcion(record.uid, clubId, plan, user)

    return { ...doc, password_temporal: password }
  }

  /** POST /api/usuarios/:id/inscripcion — inscribe (o ajusta) el plan del aspirante en un medallón. */
  @Post(':id/inscripcion')
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  inscribirEndpoint(
    @Param('id') id: string,
    @Body() dto: InscribirDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inscripciones.inscribir(id, dto, user)
  }

  /** POST /api/usuarios/:id/pruebas — registra el resultado de un requisito de su plan. */
  @Post(':id/pruebas')
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  registrarPrueba(
    @Param('id') id: string,
    @Body() dto: RegistroPruebaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inscripciones.registrarEvaluaciones(
      dto.requisito_id,
      [{ aspirante_id: id, resultado: dto.resultado, valor: dto.valor, fecha_logrado: dto.fecha_logrado }],
      user,
    )
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
