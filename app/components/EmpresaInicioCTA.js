'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function EmpresaInicioCTA() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const readUsuario = () => {
      try {
        const stored = window.sessionStorage.getItem('adoptme_user')
        setUsuario(stored ? JSON.parse(stored) : null)
      } catch {
        setUsuario(null)
      }
    }

    readUsuario()
    window.addEventListener('adoptme-auth-changed', readUsuario)
    window.addEventListener('storage', readUsuario)

    return () => {
      window.removeEventListener('adoptme-auth-changed', readUsuario)
      window.removeEventListener('storage', readUsuario)
    }
  }, [])

  if (usuario?.rol?.toLowerCase?.() !== 'empresa') return null

  return (
    <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
        Cuenta empresa
      </p>
      <h2 className="mt-2 font-serif text-2xl font-bold text-stone-800 dark:text-stone-100">
        {`Bienvenido, ${usuario.nombre}`}
      </h2>
      <p className="mt-2 text-stone-700 dark:text-stone-300">
        Publica nuevas mascotas y aparecerán en el catálogo para todos los usuarios.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/dashboard/empresa"
          className="inline-flex items-center justify-center rounded-full bg-amber-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-amber-800"
        >
          Subir mascota
        </Link>
        <Link
          href="/mascotas"
          className="inline-flex items-center justify-center rounded-full border border-amber-700/40 bg-transparent px-6 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950/40"
        >
          Ver mascotas disponibles
        </Link>
      </div>
    </div>
  )
}

