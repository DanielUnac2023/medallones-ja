import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, NotFoundException } from '@nestjs/common'
import { FirestoreService } from './firestore.service'
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard'
import { RolesGuard, Roles } from '../../common/guards/roles.guard'

/**
 * CRUD genérico para el catálogo.
 * Lectura: cualquier usuario autenticado.
 * Escritura: instructor/admin.
 * Solo colecciones en la allowlist (evita acceso arbitrario a Firestore).
 */
const COLECCIONES: Record<string, string> = {
  asociaciones: 'id_asociacion',
  distritos: 'id_distrito',
  clubes: 'id_club',
  roles: 'id_rol',
  tipo_medallon: 'id_tipo',
  medallones: 'id_tipo', // alias amigable
  secciones: 'id_seccion',
  requisitos: 'id_requisito',
}

@Controller(':coleccion')
@UseGuards(FirebaseAuthGuard)
export class CatalogoController {
  constructor(private readonly svc: FirestoreService) {}

  @Get()
  list(@Param('coleccion') coleccion: string) {
    this.validar(coleccion)
    return this.svc.list(coleccion)
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  create(@Param('coleccion') coleccion: string, @Body() body: Record<string, unknown>) {
    this.validar(coleccion)
    return this.svc.create(coleccion, COLECCIONES[coleccion], body)
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  update(@Param('coleccion') coleccion: string, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    this.validar(coleccion)
    return this.svc.update(coleccion, id, body)
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  remove(@Param('coleccion') coleccion: string, @Param('id') id: string) {
    this.validar(coleccion)
    return this.svc.remove(coleccion, id)
  }

  private validar(coleccion: string) {
    if (!COLECCIONES[coleccion]) {
      throw new NotFoundException(`Colección '${coleccion}' no permitida`)
    }
  }
}