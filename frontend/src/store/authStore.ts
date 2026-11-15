import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario, RolNombre } from '@/types/entities'

interface AuthState {
  user: Usuario | null
  setUser: (user: Usuario | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'clubestja-auth' },
  ),
)

// Helpers tipados para consumir el store
export const useAuth = () => {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const rol: RolNombre | null = user?.rol ?? null
  return { user, rol, setUser, logout, isAuthenticated: !!user }
}