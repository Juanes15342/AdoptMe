'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import Link from 'next/link'

const ESTADOS_FILTER = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobado', label: 'Aprobadas' },
  { value: 'rechazado', label: 'Rechazadas' },
  { value: 'todas', label: 'Todas' },
]

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
  const [message, setMessage] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [activeTab, setActiveTab] = useState('pendiente') // 'pendiente', 'aprobado', 'rechazado', 'todas'

  const loadSolicitudes = useCallback(async () => {
    if (!usuario?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/adopciones?empresa_id=${encodeURIComponent(String(usuario.id))}`)
      const data = await res.json()
      if (!res.ok) {
        setMessage(data?.error?.message || 'No se pudieron cargar las solicitudes')
        return
      }
      
      const solicitudesMapeadas = (Array.isArray(data) ? data : []).map((sol) => ({
        ...sol,
        estado:
          sol.estado === 'aprobada'
            ? 'aprobado'
            : sol.estado === 'rechazada'
            ? 'rechazado'
            : sol.estado,
      }))
      setSolicitudes(solicitudesMapeadas)
    } catch (err) {
      console.error(err)
      setMessage('Error de conexión cargando las solicitudes')
    } finally {
      setLoading(false)
    }
  }, [usuario?.id])

  useEffect(() => {
    if (usuario) {
      if (usuario.rol?.toLowerCase() !== 'empresa') {
        setMessage('Acceso restringido. Solo cuentas de tipo Empresa pueden acceder.')
        setLoading(false)
        return
      }
      loadSolicitudes()
    } else {
      const timer = setTimeout(() => {
        if (!window.localStorage.getItem('adoptme_user')) {
          setMessage('Por favor, inicia sesión para ver este panel.')
          setLoading(false)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [usuario, loadSolicitudes])

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id)
    setMessage('')
    try {
      const res = await fetch(`/api/adopciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data?.error || `No se pudo actualizar la solicitud a ${newStatus}`)
        return
      }
      // Actualizar estado en el frontend
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, estado: newStatus } : s))
      )
      setMessage(
        `Solicitud de adopción cambiada a ${
          newStatus === 'aprobado' ? 'aprobada' : newStatus === 'rechazado' ? 'rechazada' : 'pendiente'
        } con éxito.`
      )
    } catch (err) {
      console.error(err)
      setMessage('Error al actualizar el estado de la solicitud')
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtrar solicitudes
  const filteredSolicitudes = useMemo(() => {
    if (activeTab === 'todas') return solicitudes
    return solicitudes.filter((s) => (s.estado || '').toLowerCase() === activeTab)
  }, [solicitudes, activeTab])

  // Contadores
  const counts = useMemo(() => {
    return {
      pendiente: solicitudes.filter((s) => (s.estado || '').toLowerCase() === 'pendiente').length,
      aprobado: solicitudes.filter((s) => (s.estado || '').toLowerCase() === 'aprobado').length,
      rechazado: solicitudes.filter((s) => (s.estado || '').toLowerCase() === 'rechazado').length,
      todas: solicitudes.length,
    }
  }, [solicitudes])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-stone-50/50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 sm:text-4xl">
                Solicitudes de Adopción
              </h1>
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                Revisa y verifica la información de los adoptantes para garantizar la seguridad de los animales.
              </p>
            </div>
            <Link
              href="/dashboard/empresa"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-stone-200 dark:hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver al panel
            </Link>
          </div>
        </header>

        {message && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-950 dark:bg-amber-950/20 dark:text-amber-300">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="ml-3 text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200">
              ✕
            </button>
          </div>
        )}

        {usuario?.rol?.toLowerCase() !== 'empresa' ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800 dark:border-red-950 dark:bg-red-950/20 dark:text-red-300">
            <p className="font-semibold">Acceso restringido</p>
            <p className="mt-1 text-sm">Debes iniciar sesión con una cuenta de tipo Empresa para gestionar solicitudes.</p>
            <Link href="/login?rol=empresa" className="mt-4 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
              Iniciar Sesión
            </Link>
          </div>
        ) : (
          <>
            {/* Tabs de Filtro */}
            <div className="mb-6 flex flex-wrap gap-2 border-b border-stone-200 pb-2 dark:border-zinc-800">
              {ESTADOS_FILTER.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    activeTab === tab.value
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-800 dark:bg-zinc-900 dark:text-stone-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      activeTab === tab.value
                        ? 'bg-amber-500 text-white'
                        : 'bg-stone-100 text-stone-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {counts[tab.value] ?? counts.todas}
                  </span>
                </button>
              ))}
            </div>

            {/* Listado de Solicitudes */}
            {filteredSolicitudes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-14 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <svg className="mx-auto h-12 w-12 text-stone-400 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-stone-700 dark:text-stone-300">No hay solicitudes</h3>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  No se encontraron solicitudes en la categoría "{ESTADOS_FILTER.find((f) => f.value === activeTab)?.label}".
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredSolicitudes.map((sol) => (
                  <div
                    key={sol.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 md:flex-row"
                  >
                    {/* Información de la mascota */}
                    <div className="w-full border-b border-stone-100 bg-stone-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50 md:w-80 md:border-b-0 md:border-r">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-4">
                        Mascota Solicitada
                      </h3>
                      <div className="flex items-center gap-4 md:flex-col md:items-start">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-200 dark:bg-zinc-800 md:h-32 md:w-full">
                          {sol.mascotas?.foto_url ? (
                            <img
                              src={sol.mascotas.foto_url}
                              alt={sol.mascotas.nombre}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-stone-500">
                              Sin foto
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100 md:mt-2">
                            {sol.mascotas?.nombre || 'Sin Nombre'}
                          </h4>
                          <p className="text-sm text-stone-600 dark:text-stone-400">
                            {[sol.mascotas?.especie, sol.mascotas?.raza].filter(Boolean).join(' · ')}
                          </p>
                          {sol.mascotas?.edad && (
                            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                              Edad: {sol.mascotas.edad}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Información del adoptante */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                            Información del Adoptante
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                              sol.estado === 'aprobado'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : sol.estado === 'rechazado'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {sol.estado || 'Pendiente'}
                          </span>
                        </div>

                        <h4 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                          {sol.usuarios?.nombre || 'Usuario'}
                        </h4>

                        <div className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                          <div>
                            <span className="font-medium text-stone-500 dark:text-zinc-500">Email:</span>{' '}
                            <a
                              href={`mailto:${sol.usuarios?.email}`}
                              className="text-amber-700 hover:underline dark:text-amber-500"
                            >
                              {sol.usuarios?.email || 'No proporcionado'}
                            </a>
                          </div>
                          <div>
                            <span className="font-medium text-stone-500 dark:text-zinc-500">Teléfono:</span>{' '}
                            <a
                              href={`tel:${sol.telefono}`}
                              className="text-amber-700 hover:underline dark:text-amber-500"
                            >
                              {sol.telefono || 'No proporcionado'}
                            </a>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-medium text-stone-500 dark:text-zinc-500">Dirección:</span>{' '}
                            <span className="text-stone-800 dark:text-stone-300">
                              {sol.direccion || 'No proporcionada'}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-medium text-stone-500 dark:text-zinc-500">Fecha de envío:</span>{' '}
                            <span className="text-stone-600 dark:text-stone-400">
                              {formatFecha(sol.created_at)}
                            </span>
                          </div>
                        </div>

                        {sol.mensaje && (
                          <div className="mt-4 rounded-xl bg-stone-50 p-4 dark:bg-zinc-800/40">
                            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                              Mensaje de presentación
                            </p>
                            <p className="mt-2 text-sm italic text-stone-700 dark:text-stone-300 leading-relaxed">
                              "{sol.mensaje}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4 dark:border-zinc-800">
                        {sol.estado === 'pendiente' ? (
                          <>
                            <button
                              type="button"
                              disabled={updatingId !== null}
                              onClick={() => handleUpdateStatus(sol.id, 'aprobado')}
                              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              Aprobar Adopción
                            </button>
                            <button
                              type="button"
                              disabled={updatingId !== null}
                              onClick={() => handleUpdateStatus(sol.id, 'rechazado')}
                              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-950 dark:bg-red-950/20 dark:text-red-300 disabled:opacity-60"
                            >
                              Rechazar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={updatingId !== null}
                            onClick={() => handleUpdateStatus(sol.id, 'pendiente')}
                            className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-stone-200 dark:hover:bg-zinc-800"
                          >
                            Volver a Pendiente
                          </button>
                        )}
                        {updatingId === sol.id && (
                          <span className="text-xs text-stone-500 dark:text-stone-400 animate-pulse">
                            Guardando cambios...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
