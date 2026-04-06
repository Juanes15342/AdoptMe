'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { nombreSaludo } from '@/lib/nombreSaludo'

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

function solicitudPuedeCancelarse(estadoRaw) {
  return normalizarEstado(estadoRaw) === 'pendiente'
}

function mascotaDesdeSolicitud(s) {
  const pet = s.mascotas
  if (pet && typeof pet === 'object' && !Array.isArray(pet)) return pet
  return null
}

export default function UsuarioPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [misSolicitudes, setMisSolicitudes] = useState([])
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)
  const [error, setError] = useState('')
  const [cancelandoId, setCancelandoId] = useState(null)

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

  async function cancelarSolicitud(solicitudId) {
    if (!usuarioId || !solicitudId) return
    const ok = window.confirm('¿Cancelar esta solicitud? Esta acción no se puede deshacer.')
    if (!ok) return
    setCancelandoId(solicitudId)
    setError('')
    try {
      const res = await fetch(`/api/adopciones/${encodeURIComponent(solicitudId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ usuario_id: usuarioId }),
      })
      if (res.status === 204) {
        await loadSolicitudes(usuarioId)
        return
      }
      const data = await res.json().catch(() => ({}))
      const apiError =
        typeof data?.error === 'string'
          ? data.error
          : data?.error?.message || 'No se pudo cancelar la solicitud'
      throw new Error(apiError)
    } catch (e) {
      setError(e?.message || 'Error al cancelar')
    } finally {
      setCancelandoId(null)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] w-full bg-background dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm text-stone-600 dark:text-stone-400">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-background dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100">
              Panel de usuario
            </h1>
            <p className="mt-1 text-stone-600 dark:text-stone-400">
              {usuario
                ? `Hola, ${nombreSaludo(usuario)}`
                : 'No hay sesión guardada (haz login).'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/mascotas"
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-200 dark:hover:bg-zinc-800"
            >
              Ver catálogo completo
            </Link>
          </div>
        </header>

        {error ? (
          <div className="mb-6">
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          </div>
        ) : null}

        <section>
          <h2 className="mb-4 text-lg font-semibold text-stone-800 dark:text-stone-100">
            Mascotas en las que te postulaste
          </h2>
          <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
            Solo aparecen aquí los animales a los que ya enviaste una solicitud. Para postularte a
            otras, usa el catálogo.
          </p>

          {!usuarioId ? (
            <p className="rounded-xl border border-stone-200 bg-white px-6 py-8 text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-400">
              Inicia sesión para ver tus postulaciones.
            </p>
          ) : loadingSolicitudes ? (
            <p className="rounded-xl border border-stone-200 bg-white px-6 py-8 text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-400">
              Cargando...
            </p>
          ) : !misSolicitudes.length ? (
            <p className="rounded-xl border border-stone-200 bg-white px-6 py-8 text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-400">
              Aún no te has postulado a ninguna mascota.{' '}
              <Link href="/mascotas" className="font-medium text-amber-700 hover:underline dark:text-amber-500">
                Ver catálogo
              </Link>
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {misSolicitudes.map((s) => {
                const m = mascotaDesdeSolicitud(s)
                const badge = badgeEstado(s.estado)
                const nombre = m?.nombre ?? `Mascota #${s.mascota_id}`
                const fotoUrl = m?.foto_url
                return (
                  <li
                    key={s.id}
                    className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="relative aspect-[4/3] w-full bg-stone-100 dark:bg-zinc-800">
                      {fotoUrl ? (
                        <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-stone-400">
                          Sin foto
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-100">
                        {nombre}
                      </h3>
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                        {[m?.especie, m?.raza].filter(Boolean).join(' · ')}
                        {m?.edad ? ` · ${m.edad}` : ''}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/mascotas/${s.mascota_id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-stone-200 dark:hover:bg-zinc-900"
                        >
                          Ver detalle
                        </Link>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
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
                const pet = s.mascotas
                const fotoUrl =
                  pet && typeof pet === 'object' && !Array.isArray(pet)
                    ? pet.foto_url
                    : null
                const nombreMascota =
                  pet && typeof pet === 'object' && !Array.isArray(pet)
                    ? pet.nombre
                    : null
                return (
                  <li
                    key={s.id}
                    className="rounded-xl border border-stone-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-zinc-800">
                        {fotoUrl ? (
                          <img
                            src={fotoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-stone-400">
                            Sin foto
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">
                              {nombreMascota ?? `Mascota #${s.mascota_id}`}
                            </p>
                            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                              {pet?.especie
                                ? `${pet.especie}${pet?.raza ? ` · ${pet.raza}` : ''}`
                                : null}
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
                        {solicitudPuedeCancelarse(s.estado) ? (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => cancelarSolicitud(s.id)}
                              disabled={cancelandoId === s.id || loadingSolicitudes}
                              className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline disabled:opacity-50 dark:text-red-400"
                            >
                              {cancelandoId === s.id ? 'Cancelando...' : 'Cancelar solicitud'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}