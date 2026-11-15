import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Usuario } from '@/types/entities'

/** Sincroniza la sesión de Firebase Auth con el store global y carga el perfil completo. */
export function useAuthSync() {
  const { setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const me = await api.get<Usuario>('/me')
        setUser(me)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [setUser, logout])

  return { loading }
}

export async function login(email: string, password: string): Promise<Usuario> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  await credential.user.getIdToken(true) // fuerza un token fresco
  return api.get<Usuario>('/me')
}

export async function logout() {
  await signOut(auth)
  useAuthStore.getState().logout()
}
