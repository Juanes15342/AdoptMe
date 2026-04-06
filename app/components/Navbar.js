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
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Registro
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
