'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import Link from 'next/link'

const ESTADOS_FILTER = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobado', label: 'Aprobadas' },
  { value: 'rechazado', label: 'Rechazadas' },
  { value: 'todas', label: 'Todas' },
]

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

function EstadoBadge({ estado }) {
  const config = ESTADO_BADGE[estado] || ESTADO_BADGE.pendiente
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
export default function SolicitudesEmpresaPage() {
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
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [updatingId, setUpdatingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

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
    } catch {
      setError('Error de conexión al cargar solicitudes')
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
    loadSolicitudes()
  }, [loadSolicitudes])

  const cambiarEstado = async (solicitudId, nuevoEstado) => {
    setUpdatingId(solicitudId)
    try {
      const res = await fetch(`/api/adopciones/${solicitudId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data?.error || 'No se pudo actualizar el estado')
        return
      }
      await loadSolicitudes()
    } catch {
      setError('Error de conexión al actualizar estado')
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
  const solicitudesFiltradas =
    filtro === 'todas'
      ? solicitudes
      : solicitudes.filter((s) => s.estado === filtro)

  const contadores = {
    todas: solicitudes.length,
    pendiente: solicitudes.filter((s) => s.estado === 'pendiente').length,
    aprobado: solicitudes.filter((s) => s.estado === 'aprobado').length,
    rechazado: solicitudes.filter((s) => s.estado === 'rechazado').length,
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-background dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        {/* ——— Header ——— */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100">
                Solicitudes de adopción
              </h1>
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                Revisa y gestiona las solicitudes de clientes que quieren adoptar
                tus mascotas.
              </p>
            </div>
            <Link
              href="/dashboard/empresa"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-stone-200 dark:hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
        {/* ——— Resumen de estadísticas ——— */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ESTADOS_FILTER.map((ef) => (
            <button
              key={ef.value}
              type="button"
              onClick={() => setFiltro(ef.value)}
              className={`group relative rounded-xl border p-4 text-left transition-all ${
                filtro === ef.value
                  ? 'border-amber-400 bg-amber-50 shadow-sm dark:border-amber-700 dark:bg-amber-950/30'
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

        {/* ——— Error ——— */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {/* ——— Cargando ——— */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
              Cargando solicitudes...
            </p>
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          /* ——— Sin resultados ——— */
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
          /* ——— Lista de solicitudes ——— */
          <ul className="space-y-4">
            {solicitudesFiltradas.map((sol) => {
              const mascota = sol.mascotas || {}
              const cliente = sol.usuarios || {}
              const isExpanded = expandedId === sol.id

              return (
                <li
                  key={sol.id}
                  className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* —— Cabecera de la tarjeta —— */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : sol.id)
                    }
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

                  {/* —— Contenido expandible —— */}
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
                      {sol.estado === 'pendiente' && (
                        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-4 dark:border-zinc-800">
                          <button
                            type="button"
                            disabled={updatingId === sol.id}
                            onClick={() =>
                              cambiarEstado(sol.id, 'aprobado')
                            }
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
                            onClick={() =>
                              cambiarEstado(sol.id, 'rechazado')
                            }
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
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                              Actualizando...
                            </span>
                          )}
                        </div>
                      )}

                      {sol.estado !== 'pendiente' && (
                        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-4 dark:border-zinc-800">
                          <button
                            type="button"
                            disabled={updatingId === sol.id}
                            onClick={() =>
                              cambiarEstado(sol.id, 'pendiente')
                            }
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
                            <span className="text-xs text-stone-500 dark:text-stone-400">
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
