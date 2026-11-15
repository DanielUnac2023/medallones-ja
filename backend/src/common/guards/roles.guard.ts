import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const required = Reflect.getMetadata(ROLES_KEY, ctx.getHandler()) ?? Reflect.getMetadata(ROLES_KEY, ctx.getClass())
    if (!required) return true
    const { user } = ctx.switchToHttp().getRequest()
    if (!required.includes(user.rol)) throw new ForbiddenException('Tu rol no tiene acceso a este recurso')
    return true
  }
}
