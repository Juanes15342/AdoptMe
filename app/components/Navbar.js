'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const ROLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'usuario', label: 'Usuario' },
]

export default function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(false)
  const [usuario, setUsuario] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const readUsuario = () => {
      try {
        const stored = window.sessionStorage.getItem('adoptme_user')
        setUsuario(stored ? JSON.parse(stored) : null)
      } catch (e) {
        console.error('Error leyendo usuario almacenado', e)
        setUsuario(null)
      }
    }

    // Cerrar dropdown al hacer click fuera
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    // Leer sesión guardada (si existe)
    readUsuario()

    // Actualizar al instante cuando haga login/logout (sin recargar)
    window.addEventListener('adoptme-auth-changed', readUsuario)

    // También cubrir cambios entre pestañas/ventanas
    window.addEventListener('storage', readUsuario)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('adoptme-auth-changed', readUsuario)
      window.removeEventListener('storage', readUsuario)
    }
  }, [])

  const handleLogout = () => {
    try {
      window.sessionStorage.removeItem('adoptme_user')
      window.dispatchEvent(new Event('adoptme-auth-changed'))
    } catch (e) {
      console.error('Error eliminando sesión', e)
    }
    setUsuario(null)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/logo.png"
            alt="Adopt Me"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-contain"
          />
          <span className="text-lg font-semibold text-zinc-900 dark:text-white">
            Adopt Me
          </span>
        </Link>
        <ul className="flex items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <li>
            <Link
              href="/"
              className="transition-colors hover:text-zinc-900 dark:hover:text-white"
            >
              Inicio
            </Link>
          </li>
          <li>
            <Link
              href="/mascotas"
              className="transition-colors hover:text-zinc-900 dark:hover:text-white"
            >
              Mascotas
            </Link>
          </li>

          {usuario?.rol?.toLowerCase?.() === 'empresa' && (
            <>
              <li>
                <Link
                  href="/dashboard/empresa"
                  className="transition-colors hover:text-zinc-900 dark:hover:text-white"
                >
                  Subir mascota
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/empresa/mis-mascotas"
                  className="transition-colors hover:text-zinc-900 dark:hover:text-white"
                >
                  Mis mascotas
                </Link>
              </li>
            </>
          )}

          {/* Si NO hay usuario, mostramos login/registro */}
          {!usuario && (
            <>
              <li className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(!openDropdown)}
                  className="flex items-center gap-1 transition-colors hover:text-zinc-900 dark:hover:text-white"
                >
                  Inicio de sesión
                  <svg
                    className={`h-4 w-4 transition-transform ${openDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown && (
                  <ul className="absolute right-0 top-full mt-1 min-w-[180px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    {ROLES.map((r) => (
                      <li key={r.value}>
                        <Link
                          href={`/login?rol=${r.value}`}
                          onClick={() => setOpenDropdown(false)}
                          className="block px-4 py-2 text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          {r.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
              <li>
                <Link
                  href="/registro"
                  className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
                >
                  Registro
                </Link>
              </li>
            </>
          )}

          {/* Si hay usuario, mostramos saludo y botón salir */}
          {usuario && (
            <li className="flex items-center gap-3">
              <span className="text-sm text-zinc-700 dark:text-zinc-200">
                Hola, <span className="font-semibold">{usuario.nombre}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cerrar sesión
              </button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}
