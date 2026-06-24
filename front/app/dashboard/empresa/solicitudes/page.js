'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const ESTADOS_FILTER = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobado', label: 'Aprobadas' },
  { value: 'rechazado', label: 'Rechazadas' },
]

const ESTADO_BADGE = {
  pendiente: {
    bg: 'bg-amber-100 dark:bg-amber-950/50',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
    label: 'Pendiente',
    dot: 'bg-amber-500',
  },
  aprobado: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/50',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800',
    label: 'Aprobado',
    dot: 'bg-emerald-500',
  },
  rechazado: {
    bg: 'bg-red-100 dark:bg-red-950/50',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-300 dark:border-red-800',
    label: 'Rechazado',
    dot: 'bg-red-500',
  },
}

const mapEstado = (est) => {
  const e = String(est || '').toLowerCase().trim()
  if (e === 'aprobada' || e === 'aprobado') return 'aprobado'
  if (e === 'rechazada' || e === 'rechazado') return 'rechazado'
  return 'pendiente'
}

function EstadoBadge({ estado }) {
  const norm = mapEstado(estado)
  const config = ESTADO_BADGE[norm] || ESTADO_BADGE.pendiente
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

function formatFecha(isoString) {
  if (!isoString) return '—'
  try {
    return new Date(isoString).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export default function EmpresaSolicitudesPage() {
  const usuario = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = window.localStorage.getItem('adoptme_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [filtro, setFiltro] = useState('todas')

  const loadSolicitudes = useCallback(async () => {
    if (!usuario?.id) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/adopciones/empresa?empresa_id=${encodeURIComponent(String(usuario.id))}`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      if (!res.ok) {
        const msg =
          typeof data?.error === 'string'
            ? data.error
            : data?.error?.message || 'Error al cargar solicitudes'
        setError(msg)
        return
      }
      setSolicitudes(Array.isArray(data) ? data : [])
    } catch {
      setError('Error de conexión al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }, [usuario?.id])

  useEffect(() => {
    if (usuario) {
      if (usuario.rol?.toLowerCase() !== 'empresa') {
        setError('Acceso restringido. Solo cuentas de tipo Empresa pueden acceder.')
        setLoading(false)
        return
      }
      loadSolicitudes()
    } else {
      const timer = setTimeout(() => {
        if (!window.localStorage.getItem('adoptme_user')) {
          setError('Por favor, inicia sesión para ver este panel.')
          setLoading(false)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [usuario, loadSolicitudes])

  const cambiarEstado = async (solicitudId, nuevoEstado) => {
    setUpdatingId(solicitudId)
    setError('')
    setSuccessMessage('')
    try {
      const res = await fetch(`/api/adopciones/${solicitudId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'No se pudo actualizar el estado')
        return
      }
      setSuccessMessage(
        `Solicitud de adopción cambiada a ${
          nuevoEstado === 'aprobado' || nuevoEstado === 'aprobada' ? 'aprobada' : nuevoEstado === 'rechazado' || nuevoEstado === 'rechazada' ? 'rechazada' : 'pendiente'
        } con éxito.`
      )
      await loadSolicitudes()
    } catch {
      setError('Error de conexión al actualizar estado')
    } finally {
      setUpdatingId(null)
    }
  }

  const solicitudesFiltradas = useMemo(() => {
    if (filtro === 'todas') return solicitudes
    return solicitudes.filter((s) => mapEstado(s.estado) === filtro)
  }, [solicitudes, filtro])

  const contadores = useMemo(() => {
    return {
      todas: solicitudes.length,
      pendiente: solicitudes.filter((s) => mapEstado(s.estado) === 'pendiente').length,
      aprobado: solicitudes.filter((s) => mapEstado(s.estado) === 'aprobado').length,
      rechazado: solicitudes.filter((s) => mapEstado(s.estado) === 'rechazado').length,
    }
  }, [solicitudes])

  if (loading && !usuario) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  if (!usuario || usuario.rol?.toLowerCase() !== 'empresa') {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] w-full bg-stone-50 dark:bg-zinc-950 px-4 py-10 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800 dark:border-red-950 dark:bg-red-950/20 dark:text-red-300">
          <p className="font-semibold text-lg">Acceso restringido</p>
          <p className="mt-2 text-sm">Debes iniciar sesión con una cuenta de tipo Empresa para gestionar solicitudes.</p>
          <Link href="/login?rol=empresa" className="mt-4 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-stone-50/50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        {/* ——— Header ——— */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 sm:text-4xl">
                Solicitudes de adopción
              </h1>
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                Revisa y gestiona las solicitudes de clientes que quieren adoptar tus mascotas.
              </p>
            </div>
            <Link
              href="/dashboard/empresa"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-stone-200 dark:hover:bg-zinc-800"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Volver al panel
            </Link>
          </div>
        </header>

        {successMessage && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="ml-3 text-emerald-700 hover:text-emerald-950 dark:text-emerald-400">
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {/* ——— Resumen de estadísticas ——— */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ESTADOS_FILTER.map((ef) => (
            <button
              key={ef.value}
              type="button"
              onClick={() => setFiltro(ef.value)}
              className={`group relative rounded-xl border p-4 text-left transition-all ${
                filtro === ef.value
                  ? 'border-amber-500 bg-amber-50 shadow-sm dark:border-amber-700 dark:bg-amber-950/30'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
              }`}
            >
              <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                {contadores[ef.value]}
              </p>
              <p
                className={`mt-1 text-xs font-medium ${
                  filtro === ef.value
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {ef.label}
              </p>
              {filtro === ef.value && (
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-amber-500" />
              )}
            </button>
          ))}
        </div>

        {/* ——— Listado de Solicitudes ——— */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
              Cargando solicitudes...
            </p>
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <svg
              className="mx-auto h-12 w-12 text-stone-300 dark:text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="mt-4 text-stone-600 dark:text-stone-400">
              {filtro === 'todas'
                ? 'Aún no tienes solicitudes de adopción.'
                : `No hay solicitudes con estado "${ESTADOS_FILTER.find((f) => f.value === filtro)?.label}".`}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {solicitudesFiltradas.map((sol) => {
              const mascota = sol.mascotas || {}
              const cliente = sol.usuarios || {}
              const isExpanded = expandedId === sol.id
              const normEstado = mapEstado(sol.estado)

              return (
                <li
                  key={sol.id}
                  className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : sol.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-stone-50 dark:hover:bg-zinc-800/50"
                  >
                    {/* Foto mascota */}
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-zinc-800">
                      {mascota.foto_url ? (
                        <img
                          src={mascota.foto_url}
                          alt={mascota.nombre || 'Mascota'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg
                            className="h-6 w-6 text-stone-300 dark:text-zinc-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info principal */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-stone-800 dark:text-stone-100">
                          {cliente.nombre || 'Usuario desconocido'}
                        </p>
                        <EstadoBadge estado={sol.estado} />
                      </div>
                      <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
                        Quiere adoptar a{' '}
                        <span className="font-medium text-stone-700 dark:text-stone-300">
                          {mascota.nombre || '—'}
                        </span>
                        {' · '}
                        {formatFecha(sol.created_at)}
                      </p>
                    </div>

                    {/* Flecha expandir */}
                    <svg
                      className={`h-5 w-5 shrink-0 text-stone-400 transition-transform dark:text-zinc-500 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-stone-200 bg-stone-50/50 px-5 py-5 dark:border-zinc-800 dark:bg-zinc-950/50">
                      <div className="grid gap-5 sm:grid-cols-2">
                        {/* Columna: Info del cliente */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                            Información del cliente
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <svg
                                className="mt-0.5 h-4 w-4 shrink-0 text-stone-400 dark:text-zinc-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                                  {cliente.nombre || '—'}
                                </p>
                                <p className="text-xs text-stone-500 dark:text-stone-400">
                                  Nombre
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <svg
                                className="mt-0.5 h-4 w-4 shrink-0 text-stone-400 dark:text-zinc-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                                  {cliente.email || '—'}
                                </p>
                                <p className="text-xs text-stone-500 dark:text-stone-400">
                                  Correo electrónico
                                </p>
                              </div>
                            </div>

                            {sol.telefono && (
                              <div className="flex items-start gap-2">
                                <svg
                                  className="mt-0.5 h-4 w-4 shrink-0 text-stone-400 dark:text-zinc-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                                    {sol.telefono}
                                  </p>
                                  <p className="text-xs text-stone-500 dark:text-stone-400">
                                    Teléfono
                                  </p>
                                </div>
                              </div>
                            )}

                            {sol.direccion && (
                              <div className="flex items-start gap-2">
                                <svg
                                  className="mt-0.5 h-4 w-4 shrink-0 text-stone-400 dark:text-zinc-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                                    {sol.direccion}
                                  </p>
                                  <p className="text-xs text-stone-500 dark:text-stone-400">
                                    Dirección
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Columna: Info de la mascota */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                            Mascota solicitada
                          </h3>
                          <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-zinc-800">
                              {mascota.foto_url ? (
                                <img
                                  src={mascota.foto_url}
                                  alt={mascota.nombre || 'Mascota'}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                                  Sin foto
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-stone-800 dark:text-stone-100">
                                {mascota.nombre || '—'}
                              </p>
                              <p className="text-sm text-stone-600 dark:text-stone-400">
                                {[mascota.especie, mascota.raza]
                                  .filter(Boolean)
                                  .join(' · ')}
                                {mascota.edad ? ` · ${mascota.edad}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Mensaje del cliente */}
                          {sol.mensaje && (
                            <div>
                              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                Mensaje del cliente
                              </h3>
                              <div className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-stone-300">
                                {sol.mensaje}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* —— Acciones —— */}
                      {normEstado === 'pendiente' && (
                        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-4 dark:border-zinc-800">
                          <button
                            type="button"
                            disabled={updatingId === sol.id}
                            onClick={() => cambiarEstado(sol.id, 'aprobado')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === sol.id}
                            onClick={() => cambiarEstado(sol.id, 'rechazado')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Rechazar
                          </button>
                          {updatingId === sol.id && (
                            <span className="text-xs text-stone-500 dark:text-stone-400 animate-pulse">
                              Actualizando...
                            </span>
                          )}
                        </div>
                      )}

                      {normEstado !== 'pendiente' && (
                        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-4 dark:border-zinc-800">
                          <button
                            type="button"
                            disabled={updatingId === sol.id}
                            onClick={() => cambiarEstado(sol.id, 'pendiente')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-stone-200 dark:hover:bg-zinc-800"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Volver a pendiente
                          </button>
                          {updatingId === sol.id && (
                            <span className="text-xs text-stone-500 dark:text-stone-400 animate-pulse">
                              Actualizando...
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
