'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'

export default function MisMascotasPage() {
  const usuario = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = window.localStorage.getItem('adoptme_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const [mascotas, setMascotas] = useState([])
  const [message, setMessage] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: '',
    descripcion: '',
    foto_url: '',
  })

  const loadMascotas = useCallback(async () => {
    if (!usuario?.id) return
    try {
      const res = await fetch(
        `/api/mascotas?mine=1&userId=${encodeURIComponent(String(usuario.id))}&rol=${encodeURIComponent(String(usuario.rol ?? ''))}`
      )
      const data = await res.json()
      if (!res.ok) {
        setMessage(data?.error || 'No se pudieron cargar tus mascotas')
        return
      }
      setMascotas(Array.isArray(data) ? data : [])
    } catch {
      setMessage('Error cargando tus mascotas')
    }
  }, [usuario?.id, usuario?.rol])

  useEffect(() => {
    loadMascotas()
  }, [loadMascotas])

  const startEdit = (m) => {
    setEditId(m.id)
    setEditForm({
      nombre: m.nombre || '',
      especie: m.especie || '',
      raza: m.raza || '',
      edad: m.edad || '',
      descripcion: m.descripcion || '',
      foto_url: m.foto_url || '',
    })
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditForm({
      nombre: '',
      especie: '',
      raza: '',
      edad: '',
      descripcion: '',
      foto_url: '',
    })
  }

  const saveEdit = async (id) => {
    setSavingId(id)
    setMessage('')
    try {
      const res = await fetch(`/api/mascotas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, usuario }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data?.error || 'No se pudo editar la mascota')
        return
      }
      setMessage('Mascota actualizada correctamente')
      cancelEdit()
      await loadMascotas()
    } catch {
      setMessage('Error de conexión al editar mascota')
    } finally {
      setSavingId(null)
    }
  }

  const deleteMascota = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta mascota?')) return
    setSavingId(id)
    setMessage('')
    try {
      const res = await fetch(`/api/mascotas/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data?.error || 'No se pudo eliminar la mascota')
        return
      }
      setMessage('Mascota eliminada correctamente')
      await loadMascotas()
    } catch {
      setMessage('Error de conexión al eliminar mascota')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-background dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100">
          Mis mascotas
        </h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          Aquí solo puedes editar y eliminar las mascotas de tu empresa.
        </p>

        {message ? (
          <div className="mt-4 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {message}
          </div>
        ) : null}

        {!mascotas.length ? (
          <p className="mt-6 rounded-xl border border-stone-200 bg-white px-6 py-8 text-center text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-400">
            No tienes mascotas publicadas todavía.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {mascotas.map((m) => (
              <li key={m.id} className="rounded-xl border border-stone-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                {editId === m.id ? (
                  <div className="space-y-3">
                    <input value={editForm.nombre} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500" placeholder="Nombre" />
                    <input value={editForm.especie} onChange={(e) => setEditForm((p) => ({ ...p, especie: e.target.value }))} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500" placeholder="Especie" />
                    <input value={editForm.raza} onChange={(e) => setEditForm((p) => ({ ...p, raza: e.target.value }))} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500" placeholder="Raza" />
                    <input value={editForm.edad} onChange={(e) => setEditForm((p) => ({ ...p, edad: e.target.value }))} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500" placeholder="Edad" />
                    <input value={editForm.foto_url} onChange={(e) => setEditForm((p) => ({ ...p, foto_url: e.target.value }))} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500" placeholder="URL de foto" />
                    <textarea value={editForm.descripcion} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value }))} rows={3} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500" placeholder="Descripción" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => saveEdit(m.id)} disabled={savingId === m.id} className="rounded-md bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60">
                        Guardar
                      </button>
                      <button type="button" onClick={cancelEdit} className="rounded-md border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-20 w-20 overflow-hidden rounded-lg bg-stone-100 dark:bg-zinc-800">
                        {m.foto_url ? (
                          <img
                            src={m.foto_url}
                            alt={m.nombre || 'Mascota'}
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
                        <p className="font-semibold text-stone-800 dark:text-stone-100">{m.nombre}</p>
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                          {[m.especie, m.raza].filter(Boolean).join(' · ')}
                          {m.edad ? ` · ${m.edad}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEdit(m)} className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100">
                        Editar
                      </button>
                      <button type="button" onClick={() => deleteMascota(m.id)} disabled={savingId === m.id} className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60">
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

