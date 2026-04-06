import { createClient } from '@supabase/supabase-js'

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // En servidor, preferimos SERVICE_ROLE para poder insertar con RLS activo.
  // Si no existe, caemos a ANON (solo funcionará si tus políticas lo permiten).
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabase = createClient(supabaseUrl, supabaseKey)

  return supabase
}