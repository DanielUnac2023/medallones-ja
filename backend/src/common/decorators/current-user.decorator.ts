import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthUser } from '../guards/firebase-auth.guard'

/** Inyecta el usuario autenticado (cargado por FirebaseAuthGuard) en el handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest()
    return req.user as AuthUser
  },
)