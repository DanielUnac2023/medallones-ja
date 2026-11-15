import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { FirebaseAuthGuard, type AuthUser } from '../../common/guards/firebase-auth.guard'
import { RolesGuard, Roles } from '../../common/guards/roles.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { db } from '../../firebase/firebase.module'

interface CrearPruebaDto {
  aspirante_id: string
  requisito_id: string
  resultado: 'aprobado' | 'reprobado'
  valor: string
  fecha_logrado: string
}

/** Logros oficiales — solo instructores pueden registrar. */
@Controller('pruebas')
@UseGuards(FirebaseAuthGuard)
export class PruebasController {
  /** POST /api/pruebas — registra una prueba (multi-tenant: solo su club). */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  async crear(@Body() dto: CrearPruebaDto, @CurrentUser() user: AuthUser) {
    const aspiranteSnap = await db.collection('usuarios').doc(dto.aspirante_id).get()
    if (!aspiranteSnap.exists) throw new BadRequestException('El aspirante no existe')
    const aspirante = aspiranteSnap.data() as { club_id: string }
    if (user.rol !== 'admin' && aspirante.club_id !== user.club_id) {
      throw new ForbiddenException('El aspirante no pertenece a tu club')
    }

    const id = `${dto.aspirante_id}_${dto.requisito_id}`
    await db.collection('pruebas').doc(id).set({
      ...dto,
      registrado_por: user.uid,
      creado_el: new Date().toISOString(),
    })
    return { id, ...dto }
  }

  /** DELETE /api/pruebas/:id */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('instructor', 'admin')
  async eliminar(@Param('id') id: string) {
    await db.collection('pruebas').doc(id).delete()
    return { eliminado: true }
  }

  /** GET /api/pruebas/mias — pruebas oficiales del aspirante autenticado (con nombres). */
  @Get('mias')
  async mias(@CurrentUser() user: AuthUser) {
    const snap = await db.collection('pruebas').where('aspirante_id', '==', user.uid).get()
    const ids = [...new Set(snap.docs.map((d) => d.data().requisito_id))]
    const reqs: Record<string, { nombre: string; seccion_id: string }> = {}
    if (ids.length) {
      const reqSnap = await db.collection('requisitos').where('id_requisito', 'in', ids).get()
      reqSnap.forEach((d) => {
        const r = d.data()
        reqs[r.id_requisito] = { nombre: r.requisito, seccion_id: r.seccion_id }
      })
    }
    const secs: Record<string, string> = {}
    const secIds = Object.values(reqs).map((r) => r.seccion_id)
    if (secIds.length) {
      const secSnap = await db.collection('secciones').where('id_seccion', 'in', secIds).get()
      secSnap.forEach((d) => (secs[d.id] = d.data().seccion))
    }

    return snap.docs.map((d) => {
      const data = d.data()
      const req = reqs[data.requisito_id] ?? {}
      return {
        id: d.id,
        requisito_id: data.requisito_id,
        requisito_nombre: req.nombre ?? '—',
        seccion_nombre: secs[req.seccion_id] ?? '—',
        resultado: data.resultado,
        valor: data.valor,
        fecha_logrado: data.fecha_logrado,
      }
    })
  }
}
