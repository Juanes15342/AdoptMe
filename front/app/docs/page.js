'use client'

import { useEffect } from 'react'

export default function DocsPage() {
  useEffect(() => {
    // 1. Agregar la hoja de estilos de Swagger UI al <head>
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css'
    document.head.appendChild(link)

    // 2. Agregar el script de bundle de Swagger UI
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js'
    script.async = true
    script.onload = () => {
      if (window.SwaggerUIBundle) {
        window.SwaggerUIBundle({
          url: '/swagger.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            window.SwaggerUIBundle.presets.apis,
          ],
          layout: "BaseLayout"
        })
      }
    }
    document.body.appendChild(script)

    // Limpieza al desmontar el componente
    return () => {
      link.remove()
      script.remove()
    }
  }, [])

  return (
    <div className="bg-white min-h-screen">
      {/* Encabezado elegante para integrarse con AdoptMe */}
      <header className="border-b border-stone-200 bg-amber-50/50 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐶</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AdoptMe API Docs</h1>
              <p className="text-xs text-gray-500">Documentación oficial interactiva de la API (Swagger / OpenAPI)</p>
            </div>
          </div>
          <a
            href="/"
            className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </header>

      {/* Contenedor para el montaje de Swagger UI */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div id="swagger-ui" className="border border-stone-100 rounded-xl bg-white shadow-sm p-2"></div>
      </main>
    </div>
  )
}
