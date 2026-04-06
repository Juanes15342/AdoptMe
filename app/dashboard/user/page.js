'use client'

import { useState } from 'react'

export default function UsuarioPage() {
  const [nombre] = useState(() => {
    try {
      const stored = window.sessionStorage.getItem('adoptme_user')
      if (!stored) return ''
      const usuario = JSON.parse(stored)
      return usuario?.nombre || ''
    } catch (e) {
      console.error('No se pudo leer la sesión del usuario', e)
      return ''
    }
  })

  return (
    <div style={{ padding: '40px' }}>
      <h1>{`Bienvenido ${nombre || 'Usuario'}`}</h1>
    </div>
  )
}