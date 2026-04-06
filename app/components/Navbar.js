'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { nombreSaludo } from '@/lib/nombreSaludo'

const ROLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'usuario', label: 'Usuario' },
]

export default function Navbar() {
  const router = useRouter()
  const [openDropdown, setOpenDropdown] = useState(false)
  const [usuario, setUsuario] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function readUsuario() {
      try {
        const raw = localStorage.getItem('adoptme_user')
        setUsuario(raw ? JSON.parse(raw) : null)
      } catch {
        setUsuario(null)
      }
    }

    readUsuario()

    function handleStorage(event) {
      if (event.key === 'adoptme_user') readUsuario()
    }
    function handleAuthChanged() {
      readUsuario()
    }
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false)
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('adoptme-auth-changed', handleAuthChanged)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('adoptme-auth-changed', handleAuthChanged)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const rol = String(usuario?.rol || '').toLowerCase()
  const dashboardHref =
    rol === 'administrador'
      ? '/dashboard/admin'
      : rol === 'empresa'
        ? '/dashboard/empresa'
        : '/dashboard/user'

  function cerrarSesion() {
    try {
      localStorage.removeItem('adoptme_user')
      window.dispatchEvent(new Event('adoptme-auth-changed'))
    } catch {
      // ignore storage errors
    }
    setUsuario(null)
    setOpenDropdown(false)
    router.replace('/login')
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
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
          {usuario ? (
            <p
              className="hidden max-w-[min(14rem,40vw)] truncate text-sm text-zinc-600 dark:text-zinc-400 sm:block"
              title={nombreSaludo(usuario)}
            >
              Hola,{' '}
              <span className="font-semibold text-zinc-900 dark:text-white">
                {nombreSaludo(usuario)}
              </span>
            </p>
          ) : null}
        <ul className="flex shrink-0 items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 sm:gap-4">
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

          {usuario ? (
            <>
              {rol !== 'empresa' && (
                <li>
                  <Link
                    href={dashboardHref}
                    className="transition-colors hover:text-zinc-900 dark:hover:text-white"
                  >
                    Mi panel
                  </Link>
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={cerrarSesion}
                  className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-500"
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          ) : (
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
        </ul>
        </div>
      </nav>
    </header>
  )
}
