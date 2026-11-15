import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/authStore'
import type { RolNombre } from '@/types/entities'

interface Item {
  to: string
  icon: string
  label: string
  roles: RolNombre[]
}

const items: Item[] = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['aspirante', 'instructor', 'admin'] },
  { to: '/requisitos', icon: 'checklist', label: 'Requisitos', roles: ['instructor', 'admin'] },
  { to: '/aspirantes', icon: 'groups', label: 'Aspirantes', roles: ['instructor', 'admin'] },
  { to: '/catalogo', icon: 'category', label: 'Catálogo', roles: ['instructor', 'admin'] },
  { to: '/mis-requisitos', icon: 'military_tech', label: 'Mis requisitos', roles: ['aspirante'] },
  { to: '/mis-logros', icon: 'emoji_events', label: 'Mis logros', roles: ['aspirante'] },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const visible = items.filter((i) => user && i.roles.includes(user.rol))

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex w-full items-center gap-sm rounded-xl p-4 text-label-md text-label-md transition-all duration-200',
      isActive
        ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(255,215,0,0.3)]'
        : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface',
    )

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-20 z-40 flex h-[calc(100vh-80px)] w-64 flex-col border-r border-white/5 bg-surface-container-low/50 p-4 backdrop-blur-2xl transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="mb-base flex items-center gap-sm p-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary-container/20">
            <span
              className="material-symbols-outlined text-primary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              military_tech
            </span>
          </div>
          <div>
            <p className="text-label-md text-label-md text-primary">CLUBESTJA</p>
            <p className="text-label-sm text-label-sm text-on-surface-variant">
              {user?.rol === 'instructor' ? 'Panel instructor' : 'Mi progreso'}
            </p>
          </div>
        </div>

        <nav className="space-y-base">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClass}
              onClick={onClose}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-base">
          <button className="flex w-full items-center gap-sm rounded-xl p-4 text-label-md text-label-md text-on-surface-variant transition-all hover:bg-white/5 hover:text-on-surface">
            <span className="material-symbols-outlined">help</span>
            <span>Soporte</span>
          </button>
        </div>
      </aside>
    </>
  )
}
