import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { FirebaseAuthGuard, RolesGuard, Roles } from '../../common/guards'
import { type AuthUser } from '../../common/guards/firebase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { InscripcionesService, type EvaluacionDto } from '../inscripciones/inscripciones.service'

/** Vistas agregadas para el instructor (evita N+1 en el cliente). */
@Controller('instructor')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('instructor', 'admin')
export class InstructorController {
  constructor(private readonly inscripciones: InscripcionesService) {}

  /** GET /api/instructor/aspirantes — aspirantes del club con medallón actual y avance. */
  @Get('aspirantes')
  aspirantes(@CurrentUser() user: AuthUser) {
    return this.inscripciones.resumenAspirantes(user)
  }

  /** GET /api/instructor/aspirantes/:id — inscripción actual y plan agrupado por sección. */
  @Get('aspirantes/:id')
  detalle(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.inscripciones.detalleAspirante(id, user)
  }

  /** GET /api/instructor/requisitos/:requisito_id/aspirantes — aspirantes con ese requisito en su plan. */
  @Get('requisitos/:requisito_id/aspirantes')
  aspirantesPorRequisito(@Param('requisito_id') requisitoId: string, @CurrentUser() user: AuthUser) {
    return this.inscripciones.aspirantesPorRequisito(requisitoId, user)
  }

  /** POST /api/instructor/requisitos/:requisito_id/evaluaciones — evaluación grupal de un requisito. */
  @Post('requisitos/:requisito_id/evaluaciones')
  evaluar(
    @Param('requisito_id') requisitoId: string,
    @Body() body: { evaluaciones: EvaluacionDto[] },
    @CurrentUser() user: AuthUser,
  ) {
    return this.inscripciones.registrarEvaluaciones(requisitoId, body?.evaluaciones, user)
  }

  /** GET /api/instructor/pruebas-recientes — últimos requisitos aprobados en el club. */
  @Get('pruebas-recientes')
  recientes(@CurrentUser() user: AuthUser) {
    return this.inscripciones.recientes(user)
  }
}
