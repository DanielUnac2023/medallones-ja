import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { login } from '@/features/auth/authService'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError(null)
    try {
      const me = await login(data.email, data.password)
      setUser(me)
      navigate(me.rol === 'aspirante' ? '/inicio-aspirante' : '/inicio', { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error de conexión con el servidor')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-margin-mobile">
      {/* Blobs de fondo */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary-container/10 blur-[100px]" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-secondary-container/10 blur-[100px]" />

      <div className="glass-panel relative z-10 w-full max-w-md rounded-xl p-lg">
        <div className="mb-md text-center">
          <p className="font-headline-md text-headline-md tracking-tighter text-primary">
            CLUBESTJA
          </p>
          <p className="mt-xs text-body-md text-on-surface-variant">
            Control de requisitos y progreso
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
          <Input
            label="Email"
            type="email"
            placeholder="tuclub@ejemplo.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />

          {error && (
            <p className="rounded-md border border-error/30 bg-error-container/20 px-3 py-2 text-label-sm text-label-sm text-error">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="mt-md text-center text-label-sm text-label-sm text-on-surface-variant">
          Acceso con credenciales de Firebase Auth.
        </p>
      </div>
    </div>
  )
}
