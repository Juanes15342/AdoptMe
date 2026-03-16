'use client'

import { useState } from 'react'
import Image from 'next/image'

const ROLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'usuario', label: 'Usuario' },
]

export default function RegisterPage({ onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(ROLES[0].value)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // conexion a mi api para registrar
  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('Registrando usuario...')

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: email,
          email: email,
          password: password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Usuario registrado correctamente')
        console.log('usuario registrado:', data)
      } else {
        setMessage(data.error || 'Error en el registro')
      }
    } catch (error) {
      setMessage('Error de conexión. Inténtalo de nuevo.')
      console.error('Error en fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="Adopt Me"
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Registrarse</h1>

        {message && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
              Rol
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 outline-none bg-white"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

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
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 outline-none"
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
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 outline-none"
              placeholder="Tu contraseña"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="flex-1 inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Volver al Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}