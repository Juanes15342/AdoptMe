'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

function getUsuarioLocal() {
  try {
    const raw = localStorage.getItem('adoptme_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function normalizarEstado(raw) {
  const e = String(raw || '').trim().toLowerCase()
  if (e === 'aprobada') return 'aprobado'
  if (e === 'rechazada') return 'rechazado'
  return e
}

function badgeEstado(estadoRaw) {
  const estado = normalizarEstado(estadoRaw)
  if (estado === 'aprobado') {
    return { label: 'APROBADO', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' }
  }
  if (estado === 'rechazado') {
    return { label: 'RECHAZADO', className: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200' }
  }
  return { label: 'PENDIENTE', className: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200' }
}

export default function UsuarioPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [mascotas, setMascotas] = useState([])
  const [misSolicitudes, setMisSolicitudes] = useState([])
  const [loadingMascotas, setLoadingMascotas] = useState(true)
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)
  const [error, setError] = useState('')

  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null)
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [info, setInfo] = useState('')
  const formOpen = Boolean(mascotaSeleccionada)

  useEffect(() => {
    const usuarioLocal = getUsuarioLocal()
    if (!usuarioLocal?.id) {
      router.replace('/login?rol=usuario')
      return
    }
    setUsuario(usuarioLocal)
    setAuthChecked(true)
  }, [router])

  const usuarioId = usuario?.id

  useEffect(() => {
    let cancel = false

    async function loadMascotas() {
      setLoadingMascotas(true)
      setError('')

      if (!supabase) {
        setError('Falta configurar Supabase en .env.local')
        setLoadingMascotas(false)
        return
      }

      const { data, error: sbError } = await supabase
        .from('mascotas')
        .select('id, nombre, especie, raza, edad, descripcion, foto_url')
        .eq('disponible', true)
        .order('created_at', { ascending: false })

      if (cancel) return

      if (sbError) setError(sbError.message)
      else setMascotas(data ?? [])

      setLoadingMascotas(false)
    }

    loadMascotas()
    return () => {
      cancel = true
    }
  }, [])

  async function loadSolicitudes(idUsuario) {
    if (!idUsuario) return
    setLoadingSolicitudes(true)
    try {
      const res = await fetch(`/api/adopciones?usuario_id=${encodeURIComponent(idUsuario)}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      const apiError =
        typeof data?.error === 'string'
          ? data.error
          : data?.error?.message || 'No se pudieron cargar tus solicitudes'
      if (!res.ok) throw new Error(apiError)
      setMisSolicitudes(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e?.message || 'Error al cargar solicitudes')
    } finally {
      setLoadingSolicitudes(false)
    }
  }

  useEffect(() => {
    loadSolicitudes(usuarioId)
  }, [usuarioId])

  const solicitudesPorMascota = useMemo(() => {
    const map = new Map()
    for (const s of misSolicitudes) map.set(s.mascota_id, s)
    return map
  }, [misSolicitudes])

  async function enviarSolicitud(e) {
    e.preventDefault()
    if (!usuarioId || !mascotaSeleccionada?.id) {
      setError('Necesitas iniciar sesión y seleccionar una mascota.')
      return
    }

    setEnviando(true)
    setError('')
    setInfo('')

    try {
      const res = await fetch('/api/adopciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          usuario_id: usuarioId,
          mascota_id: mascotaSeleccionada.id,
          telefono,
          direccion,
          mensaje,
        }),
      })

      const data = await res.json()
      const apiError =
        typeof data?.error === 'string'
          ? data.error
          : data?.error?.message || 'No se pudo enviar la solicitud'
      if (!res.ok) throw new Error(apiError)

      setInfo('Solicitud enviada. Estado: pendiente.')
      setMascotaSeleccionada(null)
      setTelefono('')
      setDireccion('')
      setMensaje('')
      await loadSolicitudes(usuarioId)
    } catch (e2) {
      setError(e2?.message || 'Error al enviar solicitud')
    } finally {
      setEnviando(false)
    }
  }

  function cerrarFormulario() {
    if (enviando) return
    setMascotaSeleccionada(null)
  }

  function cerrarSesion() {
    try {
      localStorage.removeItem('adoptme_user')
    } catch {
      // ignore storage errors
    }
    router.replace('/login?rol=usuario')
  }

  if (!authChecked) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] w-full bg-stone-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm text-stone-600 dark:text-stone-400">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-stone-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100">
              Panel de usuario
            </h1>
            <p className="mt-1 text-stone-600 dark:text-stone-400">
              {usuario?.email ? `Sesión: ${usuario.email}` : 'No hay sesión guardada (haz login).'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/mascotas"
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-200 dark:hover:bg-zinc-800"
            >
              Ver catálogo completo
            </Link>
            <button
              type="button"
              onClick={cerrarSesion}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {(error || info) && (
          <div className="mb-6 space-y-3">
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            ) : null}
            {info ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                {info}
              </p>
            ) : null}
          </div>
        )}

        <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-stone-800 dark:text-stone-100">
              Mascotas disponibles
            </h2>

            {loadingMascotas ? (
              <p className="rounded-xl border border-stone-200 bg-white px-6 py-8 text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-400">
                Cargando mascotas...
              </p>
            ) : !mascotas.length ? (
              <p className="rounded-xl border border-stone-200 bg-white px-6 py-8 text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-400">
                Aún no hay mascotas disponibles.
              </p>
            ) : (
              <ul className="grid gap-6 sm:grid-cols-2">
                {mascotas.map((m) => {
                  const sol = solicitudesPorMascota.get(m.id)
                  const badge = sol ? badgeEstado(sol.estado) : null
                  return (
                    <li
                      key={m.id}
                      className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="relative aspect-[4/3] w-full bg-stone-100 dark:bg-zinc-800">
                        {m.foto_url ? (
                          <img src={m.foto_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-stone-400">
                            Sin foto
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-100">
                          {m.nombre}
                        </h3>
                        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                          {[m.especie, m.raza].filter(Boolean).join(' · ')}
                          {m.edad ? ` · ${m.edad}` : ''}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Link
                            href={`/mascotas/${m.id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-stone-200 dark:hover:bg-zinc-900"
                          >
                            Ver detalle
                          </Link>

                          {sol ? (
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setMascotaSeleccionada(m)
                                setInfo('')
                                setError('')
                              }}
                              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                              disabled={!usuarioId}
                            >
                              Solicitar adopción
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <aside className="hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:block">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
              Formulario de adopción
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {mascotaSeleccionada?.nombre
                ? `Para: ${mascotaSeleccionada.nombre}`
                : 'Selecciona una mascota para iniciar.'}
            </p>

            <form onSubmit={enviarSolicitud} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                  Teléfono
                </label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="Ej: 3001234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                  Dirección
                </label>
                <input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="Tu dirección"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                  Mensaje
                </label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="mt-1 block min-h-24 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="Cuéntanos por qué quieres adoptar..."
                />
              </div>

              <button
                type="submit"
                disabled={!mascotaSeleccionada || enviando || !usuarioId}
                className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {enviando ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </form>
          </aside>
        </section>

        <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                Mis solicitudes
              </h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Aquí ves las solicitudes que enviaste y su estado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadSolicitudes(usuarioId)}
              disabled={!usuarioId || loadingSolicitudes}
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-stone-200 dark:hover:bg-zinc-800"
            >
              {loadingSolicitudes ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {!usuarioId ? (
            <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              Inicia sesión para ver tus solicitudes.
            </p>
          ) : loadingSolicitudes ? (
            <p className="mt-5 text-sm text-stone-600 dark:text-stone-400">
              Cargando solicitudes...
            </p>
          ) : !misSolicitudes.length ? (
            <p className="mt-5 text-sm text-stone-600 dark:text-stone-400">
              Aún no tienes solicitudes.
            </p>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {misSolicitudes.map((s) => {
                const badge = badgeEstado(s.estado)
                const fecha = s.created_at ? new Date(s.created_at).toLocaleString() : ''
                return (
                  <li
                    key={s.id}
                    className="rounded-xl border border-stone-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">
                          {s.mascotas?.nombre ?? `Mascota #${s.mascota_id}`}
                        </p>
                        <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                          {s.mascotas?.especie ? `${s.mascotas.especie}${s.mascotas?.raza ? ` · ${s.mascotas.raza}` : ''}` : null}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {fecha ? (
                      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                        Enviada: {fecha}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {formOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-label="Formulario de adopción"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) cerrarFormulario()
            }}
          >
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 dark:border-zinc-800">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                    Formulario de adopción
                  </h2>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                    {mascotaSeleccionada?.nombre ? `Para: ${mascotaSeleccionada.nombre}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  disabled={enviando}
                  className="shrink-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-stone-200 dark:hover:bg-zinc-800"
                >
                  Cerrar
                </button>
              </div>

              <div className="max-h-[80vh] overflow-y-auto px-5 py-4">
                <form onSubmit={enviarSolicitud} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                      Teléfono
                    </label>
                    <input
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                      placeholder="Ej: 3001234567"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                      Dirección
                    </label>
                    <input
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                      placeholder="Tu dirección"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                      Mensaje
                    </label>
                    <textarea
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      className="mt-1 block min-h-24 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                      placeholder="Cuéntanos por qué quieres adoptar..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!mascotaSeleccionada || enviando || !usuarioId}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {enviando ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}