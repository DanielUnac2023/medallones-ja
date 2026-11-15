import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/store/authStore'
import type { RolNombre } from '@/types/entities'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: RolNombre[]
}

/** Protege una ruta por autenticación y, opcionalmente, por rol. */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (roles && user && !roles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
