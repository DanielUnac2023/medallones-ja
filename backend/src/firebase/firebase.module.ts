import { Global, Module } from '@nestjs/common'
import * as admin from 'firebase-admin'

/**
 * Inicializa firebase-admin una sola vez y expone Firestore como singleton.
 * Las credenciales viajan en FIREBASE_SERVICE_ACCOUNT_BASE64 (JSON en base64).
 */
if (!admin.apps.length) {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ?? ''
  if (!b64) {
    throw new Error(
      'Falta FIREBASE_SERVICE_ACCOUNT_BASE64. Copia backend/.env.example a .env y pega la service account codificada en base64.',
    )
  }
  const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

export const db = admin.firestore()
export { admin }

@Global()
@Module({})
export class FirestoreModule {}
