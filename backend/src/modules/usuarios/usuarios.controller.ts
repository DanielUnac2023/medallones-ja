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

  /** POST /api/usuarios — crea usuario en Firebase Auth + Firestore (demo: devuelve password temporal). */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  async create(@Body() dto: CrearUsuarioDto, @CurrentUser() user: AuthUser) {
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
    return { ...doc, password_temporal: password }
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
