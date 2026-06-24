'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const [usuario, setUsuario] = useState(null)
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos') // 'todos', 'pendiente', 'aprobado', 'rechazado'
  const [riskFilter, setRiskFilter] = useState('todos') // 'todos', 'high', 'normal'

  const loadAllSolicitudes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/adopciones')
      const data = await res.json()
      if (!res.ok) {
        setMessage(data?.error?.message || 'No se pudieron cargar las solicitudes globales')
        return
      }
      setSolicitudes(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setMessage('Error al conectar con la API de solicitudes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('adoptme_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        setUsuario(parsed)
        if (parsed.rol?.toLowerCase() !== 'administrador') {
          setMessage('Acceso denegado. Se requieren permisos de Administrador.')
          setLoading(false)
          return
        }
        loadAllSolicitudes()
      } else {
        // Esperar un momento por si la sesión tarda
        const timer = setTimeout(() => {
          if (!window.localStorage.getItem('adoptme_user')) {
            setMessage('No autorizado. Por favor inicia sesión como Administrador.')
            setLoading(false)
          }
        }, 500)
        return () => clearTimeout(timer)
      }
    } catch (e) {
      console.error('Error leyendo sesión del usuario', e)
      setMessage('Error de sesión')
      setLoading(false)
    }
  }, [loadAllSolicitudes])

  // Analizador Anti-Fraude
  const analyzedSolicitudes = useMemo(() => {
    return solicitudes.map((sol) => {
      const flags = []
      const phone = (sol.telefono || '').trim()
      const email = (sol.usuarios?.email || '').trim().toLowerCase()
      const address = (sol.direccion || '').trim().toLowerCase()
      const userId = sol.usuario_id
      const msg = (sol.mensaje || '').trim()

      if (!phone) {
        flags.push({
          type: 'warning',
          message: 'Sin número telefónico de contacto',
        })
      }

      if (msg.length > 0 && msg.length < 10) {
        flags.push({
          type: 'warning',
          message: 'Mensaje de presentación sospechosamente corto',
        })
      }

      // Buscar solicitudes con el mismo teléfono pero diferente correo
      if (phone && email) {
        const phoneMatches = solicitudes.filter(
          (s) => (s.telefono || '').trim() === phone && s.id !== sol.id
        )
        const differentEmails = phoneMatches.filter(
          (s) => (s.usuarios?.email || '').trim().toLowerCase() !== email
        )
        if (differentEmails.length > 0) {
          flags.push({
            type: 'danger',
            message: 'Mismo teléfono utilizado por cuentas de correo distintas (Posible usurpación)',
          })
        }

        // Cantidad de solicitudes hechas por la misma persona
        const userMatches = solicitudes.filter(
          (s) => s.usuario_id === userId || (s.usuarios?.email || '').trim().toLowerCase() === email
        )
        if (userMatches.length > 3) {
          flags.push({
            type: 'warning',
            message: `Usuario con alta actividad (${userMatches.length} solicitudes en total)`,
          })
        }
      }

      // Buscar direcciones idénticas registradas por distintos usuarios
      if (address && email) {
        const addressMatches = solicitudes.filter(
          (s) => (s.direccion || '').trim().toLowerCase() === address && s.id !== sol.id
        )
        const differentUsers = addressMatches.filter(
          (s) => (s.usuarios?.email || '').trim().toLowerCase() !== email
        )
        if (differentUsers.length > 0) {
          flags.push({
            type: 'danger',
            message: 'Dirección compartida por múltiples cuentas de adoptantes distintas',
          })
        }
      }

      const isHighRisk = flags.some((f) => f.type === 'danger')
      const isMediumRisk = flags.some((f) => f.type === 'warning')

      return {
        ...sol,
        flags,
        riskScore: isHighRisk ? 'alto' : isMediumRisk ? 'medio' : 'bajo',
      }
    })
  }, [solicitudes])

  // Filtrado final
  const filteredAndSearched = useMemo(() => {
    return analyzedSolicitudes.filter((sol) => {
      // Filtro de Búsqueda
      const searchLower = searchTerm.toLowerCase()
      const petName = (sol.mascotas?.nombre || '').toLowerCase()
      const clientName = (sol.usuarios?.nombre || '').toLowerCase()
      const clientEmail = (sol.usuarios?.email || '').toLowerCase()
      const matchesSearch =
        petName.includes(searchLower) ||
        clientName.includes(searchLower) ||
        clientEmail.includes(searchLower)

      // Filtro de Estado
      const matchesStatus =
        statusFilter === 'todos' || (sol.estado || '').toLowerCase() === statusFilter

      // Filtro de Riesgo
      const matchesRisk =
        riskFilter === 'todos' ||
        (riskFilter === 'high' && sol.riskScore === 'alto') ||
        (riskFilter === 'medium' && sol.riskScore === 'medio') ||
        (riskFilter === 'low' && sol.riskScore === 'bajo')

      return matchesSearch && matchesStatus && matchesRisk
    })
  }, [analyzedSolicitudes, searchTerm, statusFilter, riskFilter])

  // Contadores para KPIs
  const kpis = useMemo(() => {
    const total = analyzedSolicitudes.length
    const pendientes = analyzedSolicitudes.filter((s) => s.estado === 'pendiente').length
    const aprobadas = analyzedSolicitudes.filter((s) => s.estado === 'aprobado').length
    const rechazadas = analyzedSolicitudes.filter((s) => s.estado === 'rechazado').length
    const altoRiesgo = analyzedSolicitudes.filter((s) => s.riskScore === 'alto').length

    return { total, pendientes, aprobadas, rechazadas, altoRiesgo }
  }, [analyzedSolicitudes])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Cargando panel de control...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-stone-50/50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 sm:text-4xl">
              Panel de Auditoría de Adopciones
            </h1>
            <p className="mt-2 text-stone-600 dark:text-stone-400">
              Visualiza el estado de todos los procesos y detecta posibles fraudes o solicitudes duplicadas.
            </p>
          </div>
          <button
            onClick={loadAllSolicitudes}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            🔄 Actualizar Datos
          </button>
        </header>

        {message && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-950 dark:bg-amber-950/20 dark:text-amber-300">
            {message}
          </div>
        )}

        {usuario?.rol?.toLowerCase() !== 'administrador' ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800 dark:border-red-950 dark:bg-red-950/20 dark:text-red-300">
            <p className="font-semibold text-lg">Acceso Restringido</p>
            <p className="mt-2 text-sm">Debes iniciar sesión con una cuenta de tipo Administrador para acceder a estas métricas.</p>
            <Link href="/login?rol=administrador" className="mt-4 inline-flex rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700">
              Ir al Login
            </Link>
          </div>
        ) : (
          <>
            {/* Tarjetas de Estadísticas (KPIs) */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                  Total Solicitudes
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-800 dark:text-stone-100">{kpis.total}</p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                  Pendientes
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-500">{kpis.pendientes}</p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
                  Aprobadas
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-500">{kpis.aprobadas}</p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500">
                  Rechazadas
                </p>
                <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-500">{kpis.rechazadas}</p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm dark:border-red-950 dark:bg-red-950/20">
                <p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  ⚠️ Riesgo Alto
                </p>
                <p className="mt-2 text-3xl font-bold text-red-700 dark:text-red-400">{kpis.altoRiesgo}</p>
              </div>
            </div>

            {/* Filtros e inputs */}
            <div className="mb-6 grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                  Buscar adoptante / mascota
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ej: Max, Juan Pérez, tucorreo@..."
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                  Filtrar por Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="aprobado">Aprobadas</option>
                  <option value="rechazado">Rechazadas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                  Filtrar por Riesgo de Fraude
                </label>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="todos">Todos los niveles</option>
                  <option value="high">⚠️ Riesgo Alto (Alertas rojas)</option>
                  <option value="medium">⚠️ Riesgo Medio (Alertas amarillas)</option>
                  <option value="low">Sin riesgos detectados</option>
                </select>
              </div>
            </div>

            {/* Listado Principal de Auditoría */}
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="bg-stone-50/70 px-6 py-4 border-b border-stone-100 dark:bg-zinc-900/50 dark:border-zinc-800">
                <h3 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-100">
                  Procesos Registrados ({filteredAndSearched.length})
                </h3>
              </div>

              {filteredAndSearched.length === 0 ? (
                <div className="p-12 text-center text-stone-500 dark:text-stone-400">
                  Ninguna solicitud coincide con los filtros aplicados.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                  {filteredAndSearched.map((sol) => (
                    <div key={sol.id} className="p-6 transition-colors hover:bg-stone-50/30 dark:hover:bg-zinc-800/10">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        {/* Izquierda: Adoptante y Mascota */}
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-stone-400 dark:text-stone-500">
                              ID: {sol.id.slice(0, 8)}...
                            </span>
                            <span className="text-xs text-stone-400 dark:text-stone-500">·</span>
                            <span className="text-xs text-stone-400 dark:text-stone-500">
                              {new Date(sol.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-stone-400 dark:text-stone-500">·</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                                sol.estado === 'aprobado'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : sol.estado === 'rechazado'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
                              }`}
                            >
                              {sol.estado}
                            </span>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            {/* Adoptante */}
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                                Adoptante
                              </p>
                              <h4 className="font-bold text-stone-800 dark:text-stone-100 mt-1">
                                {sol.usuarios?.nombre || 'Usuario'}
                              </h4>
                              <p className="text-sm text-stone-600 dark:text-stone-400">
                                Email: {sol.usuarios?.email}
                              </p>
                              <p className="text-sm text-stone-600 dark:text-stone-400">
                                Teléfono: {sol.telefono || 'No especificado'}
                              </p>
                              <p className="text-sm text-stone-600 dark:text-stone-400">
                                Dirección: {sol.direccion || 'No especificada'}
                              </p>
                            </div>

                            {/* Mascota */}
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                                Mascota
                              </p>
                              <h4 className="font-bold text-stone-800 dark:text-stone-100 mt-1">
                                {sol.mascotas?.nombre || 'Mascota'}
                              </h4>
                              <p className="text-sm text-stone-600 dark:text-stone-400">
                                Especie: {sol.mascotas?.especie}
                              </p>
                              <p className="text-sm text-stone-600 dark:text-stone-400">
                                Raza/Edad: {[sol.mascotas?.raza, sol.mascotas?.edad].filter(Boolean).join(' · ') || 'No especificada'}
                              </p>
                            </div>
                          </div>

                          {sol.mensaje && (
                            <div className="rounded-lg bg-stone-50 p-3 dark:bg-zinc-800/40 text-sm text-stone-700 dark:text-stone-300 italic">
                              "{sol.mensaje}"
                            </div>
                          )}
                        </div>

                        {/* Derecha: Indicador de Fraude */}
                        <div className="w-full shrink-0 border-t border-stone-100 pt-4 lg:w-72 lg:border-t-0 lg:pt-0">
                          <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-2">
                            Auditoría de Seguridad
                          </p>

                          <div
                            className={`rounded-xl p-4 ${
                              sol.riskScore === 'alto'
                                ? 'bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/60'
                                : sol.riskScore === 'medio'
                                  ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/60'
                                  : 'bg-stone-50 border border-stone-200 dark:bg-zinc-800/30 dark:border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {sol.riskScore === 'alto' ? '🔴' : sol.riskScore === 'medio' ? '🟡' : '🟢'}
                              </span>
                              <span
                                className={`text-sm font-bold uppercase tracking-wider ${
                                  sol.riskScore === 'alto'
                                    ? 'text-red-700 dark:text-red-400'
                                    : sol.riskScore === 'medio'
                                      ? 'text-amber-700 dark:text-amber-400'
                                      : 'text-stone-600 dark:text-stone-400'
                                }`}
                              >
                                Riesgo {sol.riskScore}
                              </span>
                            </div>

                            {sol.flags.length > 0 ? (
                              <ul className="mt-3 space-y-1.5 text-xs">
                                {sol.flags.map((flag, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="shrink-0 mt-0.5">⚠️</span>
                                    <span className="text-stone-700 dark:text-stone-300 leading-tight">
                                      {flag.message}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                                Sin alertas sospechosas en el contacto, dirección o patrones de envío.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}