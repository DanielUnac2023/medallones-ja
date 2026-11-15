import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common'
import { FirebaseAuthGuard, type AuthUser } from '../../common/guards/firebase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { db } from '../../firebase/firebase.module'

interface ActualizarProgresoDto {
  valor_registrado: number
}

/** Progreso del aspirante autenticado (un campo numérico por requisito). */
@Controller('progreso')
@UseGuards(FirebaseAuthGuard)
export class ProgresoController {
  /** GET /api/progreso/mio — lista progreso registrado por el usuario. */
  @Get('mio')
  async mio(@CurrentUser() user: AuthUser) {
    const snap = await db
      .collection('progreso_aspirante')
      .where('aspirante_id', '==', user.uid)
      .get()
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  /** PUT /api/progreso/mio/:requisito_id — guarda el valor de progreso (reps o segundos). */
  @Put('mio/:requisito_id')
  async set(
    @Param('requisito_id') requisitoId: string,
    @Body() dto: ActualizarProgresoDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (dto.valor_registrado == null || Number.isNaN(dto.valor_registrado)) {
      throw new BadRequestException('valor_registrado es obligatorio y debe ser numérico')
    }
    const id = `${user.uid}_${requisitoId}`
    await db.collection('progreso_aspirante').doc(id).set({
      aspirante_id: user.uid,
      requisito_id: requisitoId,
      valor_registrado: dto.valor_registrado,
      fecha_actualizado: new Date().toISOString(),
    })
    return { id, aspirante_id: user.uid, requisito_id: requisitoId, ...dto }
  }
}
