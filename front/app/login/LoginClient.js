'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import RegisterPage from './registro'

const ROLES = [
  { value: 'usuario', label: 'Usuario' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'administrador', label: 'Administrador' },
]

const VALID_ROLES = ROLES.map((r) => r.value)

export default function LoginClient() {
  const searchParams = useSearchParams()
  const rolFromUrl = searchParams.get('rol')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(ROLES[0].value)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showRegister, setShowRegister] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (rolFromUrl && VALID_ROLES.includes(rolFromUrl)) {
      setRole(rolFromUrl)
    }
  }, [rolFromUrl])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('adoptme_user')
      if (stored) {
        const usuario = JSON.parse(stored)
        const rolUsuario = (usuario.rol || '').toLowerCase()

        if (rolUsuario === 'administrador') {
          router.push('/dashboard/admin')
        } else if (rolUsuario === 'empresa') {
          router.push('/dashboard/empresa')
        } else if (rolUsuario === 'usuario') {
          router.push('/dashboard/user')
        }
      }
    } catch (e) {
      console.error('Error leyendo sesión almacenada', e)
    }
  }, [router])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('Iniciando sesión...')

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          role: role,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Login exitoso')

        try {
          localStorage.setItem('adoptme_user', JSON.stringify(data.usuario))
          window.dispatchEvent(new Event('adoptme-auth-changed'))
        } catch {
          // ignore storage errors
        }

        const rolUsuario = (data.usuario?.rol || '').toLowerCase()

        if (rolUsuario === 'administrador') {
          router.push('/dashboard/admin')
        } else if (rolUsuario === 'empresa') {
          router.push('/dashboard/empresa')
        } else if (rolUsuario === 'usuario') {
          router.push('/dashboard/user')
        }
      } else {
        setMessage(data.error || 'Error en el login')
      }
    } catch (error) {
      setMessage('Error de conexión. Inténtalo de nuevo.')
      console.error('Error en fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterClick = () => {
    setShowRegister(true)
  }

  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState(1)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [devCode, setDevCode] = useState('')

  const handleRequestCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: recoveryEmail,
          action: 'request',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Código enviado')
        if (data.devCode) {
          setDevCode(data.devCode)
        }
        setRecoveryStep(2)
      } else {
        setMessage(data.error || 'Error al solicitar el código')
      }
    } catch (err) {
      setMessage('Error de conexión. Inténtalo de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: recoveryEmail,
          code: recoveryCode,
          action: 'verify',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Código verificado')
        setRecoveryStep(3)
      } else {
        setMessage(data.error || 'Código incorrecto o expirado')
      }
    } catch (err) {
      setMessage('Error de conexión. Inténtalo de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden')
      return
    }
    if (newPassword.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: recoveryEmail,
          code: recoveryCode,
          password: newPassword,
          action: 'reset',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Contraseña restablecida con éxito. Ya puedes iniciar sesión.')
        setTimeout(() => {
          setShowForgotPassword(false)
          setRecoveryStep(1)
          setRecoveryEmail('')
          setRecoveryCode('')
          setNewPassword('')
          setConfirmPassword('')
          setDevCode('')
          setMessage('')
        }, 3000)
      } else {
        setMessage(data.error || 'Error al restablecer la contraseña')
      }
    } catch (err) {
      setMessage('Error de conexión. Inténtalo de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (showRegister) {
    return <RegisterPage onBack={() => setShowRegister(false)} />
  }

  if (showForgotPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-gradient-to-br from-amber-50/90 via-[#fffbf0] to-orange-50/50 px-4 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
        <div className="w-full max-w-md rounded-2xl border border-amber-200/70 bg-white/95 p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo.png"
              alt="Adopt Me"
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-gray-500 mb-6 text-center">
            {recoveryStep === 1 && "Introduce tu correo electrónico para enviarte un código de recuperación."}
            {recoveryStep === 2 && "Introduce el código de verificación enviado a tu correo."}
            {recoveryStep === 3 && "Escribe tu nueva contraseña de acceso."}
          </p>

          {message && (
            <div className={`mb-4 rounded-md border px-4 py-2 text-sm ${
              message.includes('exitoso') || message.includes('éxito') || message.includes('enviado') || message.includes('correcto') || message.includes('verificado')
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}>
              {message}
            </div>
          )}

          {/* Paso 1: Solicitar Código */}
          {recoveryStep === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="recovery-email">
                  Correo electrónico
                </label>
                <input
                  id="recovery-email"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-amber-500 focus:ring-amber-500"
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'Enviando...' : 'Enviar Código'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setMessage('')
                  }}
                  className="flex-1 inline-flex justify-center rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Paso 2: Verificar Código */}
          {recoveryStep === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              {devCode && (
                <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800">
                  <span className="font-semibold">Modo Desarrollo:</span> Tu código de verificación es <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-sm text-amber-900">{devCode}</code>.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="recovery-code">
                  Código de verificación
                </label>
                <input
                  id="recovery-code"
                  type="text"
                  maxLength={6}
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-gray-900 tracking-widest text-center font-mono font-semibold shadow-sm outline-none focus:border-amber-500 focus:ring-amber-500"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'Verificando...' : 'Verificar Código'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryStep(1)
                    setMessage('')
                  }}
                  className="flex-1 inline-flex justify-center rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 cursor-pointer"
                >
                  Volver
                </button>
              </div>
            </form>
          )}

          {/* Paso 3: Nueva Contraseña */}
          {recoveryStep === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-password">
                  Nueva contraseña
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-amber-500 focus:ring-amber-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirm-password">
                  Confirmar nueva contraseña
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-amber-500 focus:ring-amber-500"
                  placeholder="Repite la contraseña"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'Restableciendo...' : 'Guardar Contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryStep(2)
                    setMessage('')
                  }}
                  className="flex-1 inline-flex justify-center rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 cursor-pointer"
                >
                  Volver
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-gradient-to-br from-amber-50/90 via-[#fffbf0] to-orange-50/50 px-4 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-md rounded-2xl border border-amber-200/70 bg-white/95 p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="Adopt Me"
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Iniciar sesión
        </h1>

        {message && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-amber-500 focus:ring-amber-500"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                Contraseña
              </label>
              {/* Ocultado temporalmente por solicitud del usuario */}
              {false && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true)
                    setMessage('')
                  }}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline outline-none cursor-pointer"
                >
                  ¿Olvidé mi contraseña?
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-amber-500 focus:ring-amber-500"
              placeholder="Tu contraseña"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
              Rol
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-amber-500 focus:ring-amber-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={handleRegisterClick}
              className="flex-1 inline-flex justify-center rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 cursor-pointer"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


