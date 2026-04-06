'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PetCard from '@/app/components/PetCards'
import AdopcionFormModal from '@/app/components/AdopcionFormModal'

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
    return {
      label: 'APROBADO',
      className:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
    }
  }
  if (estado === 'rechazado') {
    return {
      label: 'RECHAZADO',
      className: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200',
    }
  }
  return {
    label: 'PENDIENTE',
    className:
      'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  }
}

export default function MascotasCatalogoCliente({ mascotas }) {
  const [usuario, setUsuario] = useState(null)
  const [solicitudes, setSolicitudes] = useState([])
  const [mascotaModal, setMascotaModal] = useState(null)

  useEffect(() => {
    setUsuario(getUsuarioLocal())
    function onAuth() {
      setUsuario(getUsuarioLocal())
    }
    window.addEventListener('adoptme-auth-changed', onAuth)
    window.addEventListener('storage', onAuth)
    return () => {
      window.removeEventListener('adoptme-auth-changed', onAuth)
      window.removeEventListener('storage', onAuth)
    }
  }, [])

  const usuarioId = usuario?.id
  const esAdoptante =
    String(usuario?.rol || '').toLowerCase() === 'usuario' && Boolean(usuarioId)

  const loadSolicitudes = useCallback(async () => {
    if (!usuarioId || !esAdoptante) {
      setSolicitudes([])
      return
    }
    try {
      const res = await fetch(
        `/api/adopciones?usuario_id=${encodeURIComponent(usuarioId)}`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      if (!res.ok) return
      setSolicitudes(Array.isArray(data) ? data : [])
    } catch {
      setSolicitudes([])
    }
  }, [usuarioId, esAdoptante])

  useEffect(() => {
    loadSolicitudes()
  }, [loadSolicitudes])

  const solicitudesPorMascota = useMemo(() => {
    const map = new Map()
    for (const s of solicitudes) map.set(s.mascota_id, s)
    return map
  }, [solicitudes])

  if (!mascotas?.length) {
    return (
      <p className="rounded-xl border border-stone-200 bg-white px-6 py-10 text-center text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-400">
        Aún no hay mascotas publicadas. Vuelve pronto.
      </p>
    )
  }

  return (
    <>
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {mascotas.map((m) => {
          const sol = esAdoptante ? solicitudesPorMascota.get(m.id) : null
          const badge = sol ? badgeEstado(sol.estado) : null
          return (
            <li key={m.id}>
              <PetCard
                mascota={m}
                adopcionSlot={
                  esAdoptante ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/mascotas/${m.id}`}
                        className="inline-flex flex-1 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-stone-200 dark:hover:bg-zinc-900"
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
                          onClick={() => setMascotaModal(m)}
                          className="inline-flex flex-1 items-center justify-center rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                          disabled={!usuarioId}
                        >
                          Solicitar adopción
                        </button>
                      )}
                    </div>
                  ) : null
                }
              />
            </li>
          )
        })}
      </ul>

      {esAdoptante ? (
        <AdopcionFormModal
          open={Boolean(mascotaModal)}
          mascota={mascotaModal}
          usuarioId={usuarioId}
          onClose={() => setMascotaModal(null)}
          onSuccess={loadSolicitudes}
        />
      ) : null}
    </>
  )
}
