'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function EmpresaPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: '',
    descripcion: '',
    foto_url: '',
  })
  const [fotoFile, setFotoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [ultima, setUltima] = useState(null)
  const [uploadWarning, setUploadWarning] = useState('')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('adoptme_user')
      if (stored) {
        setUsuario(JSON.parse(stored))
      } else {
        router.replace('/login?rol=empresa')
      }
    } catch (e) {
      console.error('Error cargando usuario', e)
    } finally {
      setAuthChecked(true)
    }
  }, [router])

  const nombre = usuario?.nombre || ''

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setUploadWarning('')

    try {
      let fotoUrlFinal = form.foto_url

      // Si selecciona archivo local, lo subimos a Supabase Storage y usamos su URL
      if (fotoFile) {
        const fd = new FormData()
        fd.append('file', fotoFile)
        fd.append('rol', String(usuario?.rol ?? ''))
        fd.append('userId', String(usuario?.id ?? ''))

        const uploadRes = await fetch('/api/mascotas/upload', {
          method: 'POST',
          body: fd,
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          // No bloqueamos el guardado de la mascota si falla Storage.
          fotoUrlFinal = form.foto_url || ''
          setUploadWarning(
            `No se pudo subir la imagen (${uploadData?.error || 'error de Storage'}). Se guardará la mascota sin foto subida local.`
          )
        } else {
          fotoUrlFinal = uploadData.publicUrl
        }
      }

      const res = await fetch('/api/mascotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, foto_url: fotoUrlFinal, usuario }),
      })

      const data = await res.json()
      if (!res.ok) {
        setMessage(data?.error || 'No se pudo publicar la mascota')
        return
      }

      setUltima(data)
      setMessage('Mascota publicada correctamente')
      setForm({
        nombre: '',
        especie: '',
        raza: '',
        edad: '',
        descripcion: '',
        foto_url: '',
      })
      setFotoFile(null)
    } catch (err) {
      console.error(err)
      setMessage('Error de conexión publicando la mascota')
    } finally {
      setLoading(false)
    }
  }


  if (!authChecked) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (!usuario || usuario.rol?.toLowerCase() !== 'empresa') {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] w-full bg-stone-50 dark:bg-zinc-950 px-4 py-10 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800 dark:border-red-950 dark:bg-red-950/20 dark:text-red-300">
          <p className="font-semibold text-lg">Acceso restringido</p>
          <p className="mt-2 text-sm">Debes iniciar sesión con una cuenta de tipo Empresa para acceder a este panel.</p>
          <Link href="/login?rol=empresa" className="mt-4 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-background dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100">
            {`Bienvenido ${nombre || 'Empresa'}`}
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Desde aquí puedes publicar nuevas mascotas para adopción.
          </p>
        </header>

        {message ? (
          <div className="mb-6 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {message}
          </div>
        ) : null}

        {uploadWarning ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
            {uploadWarning}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            Subir mascota
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Nombre *
              </label>
              <input
                value={form.nombre}
                onChange={onChange('nombre')}
                required
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Especie *
              </label>
              <input
                value={form.especie}
                onChange={onChange('especie')}
                required
                placeholder="Perro, Gato..."
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Raza
              </label>
              <input
                value={form.raza}
                onChange={onChange('raza')}
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Edad
              </label>
              <input
                value={form.edad}
                onChange={onChange('edad')}
                placeholder="Ej: 2 años"
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Foto (subir desde tu PC o pegar URL)
              </label>
              <div className="mt-1 grid gap-3 sm:grid-cols-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <input
                  value={form.foto_url}
                  onChange={onChange('foto_url')}
                  placeholder="https://..."
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                Si eliges un archivo, se sube automáticamente y se usa esa imagen.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Descripción
              </label>
              <textarea
                value={form.descripcion}
                onChange={onChange('descripcion')}
                rows={4}
                className="mt-1 w-full resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
            >
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
            <Link
              href="/mascotas"
              className="text-sm font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-500 dark:hover:text-amber-400"
            >
              Ver catálogo público →
            </Link>
          </div>
        </form>

        {ultima ? (
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Última mascota publicada
            </h3>
            <p className="mt-2 text-lg font-semibold text-stone-800 dark:text-stone-100">
              {ultima.nombre}
            </p>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {[ultima.especie, ultima.raza].filter(Boolean).join(' · ')}
              {ultima.edad ? ` · ${ultima.edad}` : ''}
            </p>
          </div>
        ) : null}

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            Gestionar mascotas
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Para editar o eliminar, entra al apartado de tus mascotas.
          </p>
          <Link
            href="/dashboard/empresa/mis-mascotas"
            className="mt-4 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Ir a Mis mascotas
          </Link>
        </section>

        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/50">
              <svg
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                Solicitudes de adopción
              </h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Revisa los datos de los clientes interesados en adoptar tus
                mascotas y gestiona sus solicitudes.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/empresa/solicitudes"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
          >
            Ver solicitudes
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </section>
      </div>
    </div>
  )
}