/**
 * Nombre para saludo según rol (empresa → nombre comercial, resto → nombre o parte local del email).
 */
export function nombreSaludo(usuario) {
  if (!usuario) return ''
  const r = String(usuario.rol || '').toLowerCase()
  const empresa =
    (typeof usuario.nombre_empresa === 'string' && usuario.nombre_empresa.trim()) ||
    (typeof usuario.empresa_nombre === 'string' && usuario.empresa_nombre.trim())
  if (r === 'empresa' && empresa) return empresa
  if (typeof usuario.nombre === 'string' && usuario.nombre.trim()) return usuario.nombre.trim()
  if (typeof usuario.email === 'string' && usuario.email.includes('@')) {
    return usuario.email.split('@')[0]
  }
  return 'Usuario'
}
