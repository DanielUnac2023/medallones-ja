import { useAuth } from '@/store/authStore'

export function GlassNav({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout: doLogout } = useAuth()

  return (
    <nav className="fixed top-0 z-50 flex h-20 w-full items-center justify-between border-b border-white/10 bg-surface/30 px-margin-mobile shadow-lg shadow-black/20 backdrop-blur-xl md:px-margin-desktop">
      <div className="flex items-center gap-gutter">
        <button
          className="rounded-full p-2 text-on-surface-variant hover:bg-white/5 md:hidden"
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-headline-md text-headline-md tracking-tighter text-primary">
          CLUBESTJA
        </span>
      </div>

      <div className="flex items-center gap-base">
        <button className="rounded-full p-2 text-on-surface-variant transition-all hover:bg-white/5">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="flex items-center gap-sm">
          <div className="text-right">
            <p className="text-label-md text-label-md text-on-surface">{user?.nombre}</p>
            <p className="text-label-sm text-label-sm capitalize text-on-surface-variant">
              {user?.rol}
            </p>
          </div>
          <button
            onClick={doLogout}
            title="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-on-surface-variant transition-all hover:bg-white/5 hover:text-error"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
