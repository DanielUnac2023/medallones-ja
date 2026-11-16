import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { db } from '../../firebase/firebase.module'

/** Servicio genérico de Firestore para las colecciones del catálogo. */
@Injectable()
export class FirestoreService {
  async list(coleccion: string): Promise<Record<string, unknown>[]> {
    const snap = await db.collection(coleccion).get()
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
  }

  async get(coleccion: string, id: string): Promise<Record<string, unknown>> {
    const doc = await db.collection(coleccion).doc(id).get()
    if (!doc.exists) throw new NotFoundException(`${coleccion}/${id} no encontrado`)
    return { id: doc.id, ...(doc.data() as Record<string, unknown>) }
  }

  async create(coleccion: string, idField: string, data: Record<string, unknown>) {
    const id = String(data[idField] || randomUUID())
    await db.collection(coleccion).doc(id).set({ ...data, [idField]: id })
    return { id, ...data, [idField]: id }
  }

  async update(coleccion: string, id: string, data: Record<string, unknown>) {
    await db.collection(coleccion).doc(id).update(data)
    return { id, ...data }
  }

  async remove(coleccion: string, id: string) {
    await db.collection(coleccion).doc(id).delete()
    return { eliminado: true }
  }
}