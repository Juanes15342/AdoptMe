'use client'

import { useEffect, useState } from 'react'

export default function AdopcionFormModal({
  open,
  mascota,
  usuarioId,
  onClose,
  onSuccess,
}) {
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setTelefono('')
      setDireccion('')
      setMensaje('')
      setError('')
    }
  }, [open, mascota?.id])

  async function enviarSolicitud(e) {
    e.preventDefault()
    if (!usuarioId || !mascota?.id) {
      setError('Necesitas iniciar sesión y seleccionar una mascota.')
      return
    }

    setEnviando(true)
    setError('')

    try {
      const res = await fetch('/api/adopciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          usuario_id: usuarioId,
          mascota_id: mascota.id,
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

      onSuccess?.()
      onClose?.()
      setTelefono('')
      setDireccion('')
      setMensaje('')
    } catch (e2) {
      setError(e2?.message || 'Error al enviar solicitud')
    } finally {
      setEnviando(false)
    }
  }

  function cerrar() {
    if (enviando) return
    onClose?.()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Formulario de adopción"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cerrar()
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
              Formulario de adopción
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {mascota?.nombre ? `Para: ${mascota.nombre}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={cerrar}
            disabled={enviando}
            className="shrink-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-stone-200 dark:hover:bg-zinc-800"
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-5 py-4">
          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          ) : null}
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
              disabled={!mascota || enviando || !usuarioId}
              className="inline-flex w-full items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {enviando ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
