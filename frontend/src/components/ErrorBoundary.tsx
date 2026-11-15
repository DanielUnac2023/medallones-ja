import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Texto opcional mostrado como título del fallback. */
  titulo?: string
}

interface State {
  error: Error | null
}

/**
 * Boundary genérico: si un hijo falla al renderizar, muestra un panel
 * con el mensaje del error en lugar de dejar la pantalla en blanco.
 * Útil para secciones que dependen de datos remotos con forma variable.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      const { titulo } = this.props
      const mensaje = this.state.error.message || 'Error inesperado'
      return (
        <div
          role="alert"
          className="glass-panel mx-auto max-w-md rounded-xl border border-error/30 bg-error-container/20 p-lg text-center"
        >
          <p className="font-headline-md text-headline-md text-error">
            {titulo ?? 'Algo salió mal'}
          </p>
          <p className="mt-xs break-words text-body-md text-on-surface">{mensaje}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-md rounded-md border border-white/10 bg-white/5 px-base py-2 text-label-md text-on-surface transition-colors hover:bg-white/10"
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
