'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import RegisterPage from './registro'

const ROLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'usuario', label: 'Usuario' },
]

const VALID_ROLES = ROLES.map((r) => r.value)

export default function LoginPage() {
  const searchParams = useSearchParams()
  const rolFromUrl = searchParams.get('rol')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(ROLES[0].value)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showRegister, setShowRegister] = useState(false)

// instancia del router para dirigir despues del login
  const router = useRouter()

  // Si viene el rol por URL lo seleccionamos
  useEffect(() => {
    if (rolFromUrl && VALID_ROLES.includes(rolFromUrl)) {
      setRole(rolFromUrl)
    }
  }, [rolFromUrl])

  // Si ya hay sesión guardada, redirigimos directamente a su dashboard
  useEffect(() => {
    try {
      const stored = localStorage.getItem('adoptme_user')
      if (stored) {
        const usuario = JSON.parse(stored)
        const rolUsuario = (usuario.rol || '').toLowerCase()

        if (rolUsuario === 'administrador') {
          router.push('/dashboard/admin')
        } else if (rolUsuario === 'empresa' || rolUsuario === 'usuario') {
          router.push('/')
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

  //conexion a mi api para autenticar
 try {
     const response = await fetch('/api/auth', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         email: email,
         password: password,
       }),
     })

     const data = await response.json()

    if (response.ok) {
      setMessage('Login exitoso')
      console.log('usuario logueado:', data.usuario)

      try {
        localStorage.setItem('adoptme_user', JSON.stringify(data.usuario))
        window.dispatchEvent(new Event('adoptme-auth-changed'))
      } catch {
        // ignore storage errors
      }

      const rolUsuario = data.usuario.rol.toLowerCase()

      if (rolUsuario === "administrador") {
        router.push("/dashboard/admin")
      } else if (rolUsuario === "empresa" || rolUsuario === "usuario") {
        router.push("/")
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

  if (showRegister) {
    return <RegisterPage onBack={() => setShowRegister(false)} />
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
        <h1 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Iniciar sesión</h1>

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
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Contraseña
            </label>
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

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={handleRegisterClick}
              className="flex-1 inline-flex justify-center rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

