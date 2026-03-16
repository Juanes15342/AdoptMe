'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'



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

 const handleSubmit = async (event) => {
  event.preventDefault()
  if (!supabase) {
    setMessage('Error: Supabase no configurado. Revisa .env.local')
    return
  }
  setLoading(true)
  setMessage('Registrando usuario...')

  try {
    // 1️⃣ Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const user = data.user

    // 2️⃣ Obtener id del tipo de cuenta
    const { data: tipoCuenta, error: roleError } = await supabase
      .from('tipo_cuenta')
      .select('id')
      .eq('nombre', role)
      .single()

    if (roleError) {
      setMessage('Error obteniendo tipo de cuenta')
      setLoading(false)
      return
    }

    // 3️⃣ Guardar usuario en tabla usuarios
    const { error: insertError } = await supabase
      .from('usuarios')
      .insert({
        id: user.id,
        email: email,
        tipo_cuenta_id: tipoCuenta.id
      })

    if (insertError) {
      setMessage(insertError.message)
      setLoading(false)
      return
    }

    setMessage('Usuario registrado correctamente')

  } catch (err) {
    setMessage('Error inesperado')
  }

  setLoading(false)

   
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
