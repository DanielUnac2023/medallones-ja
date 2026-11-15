import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { getAuth } from 'firebase-admin/auth'
import { db } from '../../firebase/firebase.module'

export interface AuthUser {
  uid: string
  id_usuario: string
  nombre: string
  email: string
  telefono: string
  rol: string
  club_id: string
}

declare module 'express' {
  interface Request {
    user: AuthUser
  }
}

/** Verifica el ID token de Firebase y carga el perfil del usuario desde Firestore. */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const header: string = req.headers.authorization ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) throw new UnauthorizedException('Se requiere token Bearer')

    const decoded = await getAuth().verifyIdToken(token)
    const doc = await db.collection('usuarios').doc(decoded.uid).get()
    if (!doc.exists) throw new UnauthorizedException('Usuario no registrado en la base de datos')

    const data = doc.data() as {
      nombre: string
      email: string
      telefono?: string
      rol: string
      club_id?: string
    }

    req.user = {
      uid: decoded.uid,
      id_usuario: decoded.uid,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono ?? '',
      rol: data.rol,
      club_id: data.club_id ?? '',
    }
    return true
  }
}