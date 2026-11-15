import { Controller, Get, UseGuards } from '@nestjs/common'
import { FirebaseAuthGuard, type AuthUser } from '../../common/guards/firebase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller()
@UseGuards(FirebaseAuthGuard)
export class AuthController {
  /** GET /api/me — perfil del usuario autenticado (rol, club, etc.). */
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return {
      id_usuario: user.uid,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono ?? '',
      rol: user.rol,
      club_id: user.club_id ?? '',
    }
  }
}
