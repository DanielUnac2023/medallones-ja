import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
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
  // inscripciones e inscripcion_requisitos NO van aquí: solo se escriben vía InscripcionesService.
}

/** Rutas amigables que apuntan a otra colección de Firestore. */
const ALIAS: Record<string, string> = { medallones: 'tipo_medallon' }

/** Campos numéricos que llegan de formularios y deben guardarse como número. */
const NUMERICOS = ['secciones_min', 'requisitos_min']

function normalizar(body: Record<string, unknown>) {
  const out = { ...body }
  for (const k of NUMERICOS) {
    if (k in out) {
      const n = Number(out[k])
      if (!Number.isInteger(n) || n < 1) throw new BadRequestException(`${k} debe ser un entero mayor o igual a 1`)
      out[k] = n
    }
  }
  return out
}

@Controller(':coleccion')
@UseGuards(FirebaseAuthGuard)
export class CatalogoController {
  constructor(private readonly svc: FirestoreService) {}

  @Get()
  list(@Param('coleccion') coleccion: string) {
    return this.svc.list(this.real(coleccion))
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  create(@Param('coleccion') coleccion: string, @Body() body: Record<string, unknown>) {
    return this.svc.create(this.real(coleccion), COLECCIONES[coleccion], normalizar(body))
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  update(@Param('coleccion') coleccion: string, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.update(this.real(coleccion), id, normalizar(body))
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  remove(@Param('coleccion') coleccion: string, @Param('id') id: string) {
    return this.svc.remove(this.real(coleccion), id)
  }

  /** Valida la colección contra la allowlist y resuelve su nombre real en Firestore. */
  private real(coleccion: string) {
    if (!COLECCIONES[coleccion]) {
      throw new NotFoundException(`Colección '${coleccion}' no permitida`)
    }
    return ALIAS[coleccion] ?? coleccion
  }
}