import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { GlassNav } from './GlassNav'
import { Sidebar } from './Sidebar'
import { useAuthSync } from '@/features/auth/authService'
import { useAuth } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'

/** Shell con nav sticky + sidebar; protege rutas de no autenticados. */
export function AppShell() {
  const { loading } = useAuthSync()
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size={40} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <GlassNav onToggleSidebar={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="min-h-screen pt-24 px-margin-mobile pb-xl md:ml-64 md:px-margin-desktop">
        <Outlet />
      </main>
    </div>
  )
}
