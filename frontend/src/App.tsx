import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { useAuth } from '@/store/authStore'
import { LoginPage } from '@/pages/Login'
import { InstructorDashboard } from '@/features/instructor/InstructorDashboard'
import { AspirantesPage } from '@/features/instructor/AspirantesPage'
import { AspiranteDetallePage } from '@/features/instructor/AspiranteDetallePage'
import { RequisitosPage } from '@/features/instructor/RequisitosPage'
import { EvaluarRequisitoPage } from '@/features/instructor/EvaluarRequisitoPage'
import { CatalogoPage } from '@/features/instructor/CatalogoPage'
import { AspiranteDashboard } from '@/features/aspirante/AspiranteDashboard'
import { MisRequisitosPage } from '@/features/aspirante/MisRequisitosPage'
import { MisLogrosPage } from '@/features/aspirante/MisLogrosPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardRouter />} />
          {/* Instructor / Admin */}
          <Route
            path="/inicio"
            element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requisitos"
            element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <RequisitosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requisitos/:requisitoId/evaluar"
            element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <EvaluarRequisitoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/aspirantes"
            element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <AspirantesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/aspirantes/:aspiranteId"
            element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <AspiranteDetallePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogo"
            element={
              <ProtectedRoute roles={['instructor', 'admin']}>
                <CatalogoPage />
              </ProtectedRoute>
            }
          />
          {/* Aspirante */}
          <Route
            path="/mis-requisitos"
            element={
              <ProtectedRoute roles={['aspirante']}>
                <MisRequisitosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-logros"
            element={
              <ProtectedRoute roles={['aspirante']}>
                <MisLogrosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inicio-aspirante"
            element={
              <ProtectedRoute roles={['aspirante']}>
                <AspiranteDashboard />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  )
}

/** Redirige /dashboard al home correspondiente según el rol. */
function DashboardRouter() {
  const { user } = useAuth()
  return <Navigate to={user?.rol === 'aspirante' ? '/inicio-aspirante' : '/inicio'} replace />
}
