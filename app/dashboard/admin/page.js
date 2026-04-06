'use client'

import { useState } from 'react'

export default function Page() {
  const [nombre] = useState(() => {
    try {
      const stored = window.localStorage.getItem('adoptme_user')
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
      <h2>{`Bienvenido ${nombre || 'Administrador'}`}</h2>
    </div>
  )
}