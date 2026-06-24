import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_CANDIDATE_COLUMNS = [
  "empresa_id",
  "empresa_usuario_id",
  "usuario_id",
  "owner_id",
  "creado_por",
];

async function findOwnerColumn(supabase) {
  for (const column of OWNER_CANDIDATE_COLUMNS) {
    const { error } = await supabase
      .from("mascotas")
      .select(`id, ${column}`)
      .limit(1);
    if (!error) return column;
  }
  return null;
}

function supabaseErrorToJson(error) {
  if (!error) return null;
  return {
    message: error.message ?? String(error),
    details: error.details ?? null,
    hint: error.hint ?? null,
    code: error.code ?? null,
  };
}

// GET - listar solicitudes de adopción para las mascotas de una empresa
export async function GET(request) {
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const empresaId = searchParams.get("empresa_id");

  if (!empresaId) {
    return Response.json(
      { error: "empresa_id es obligatorio" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // 1. Encontrar la columna de propietario en mascotas
  const ownerColumn = await findOwnerColumn(supabase);
  if (!ownerColumn) {
    return Response.json(
      { error: "La tabla mascotas no tiene columna de propietario." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  // 2. Obtener IDs de mascotas de esta empresa
  const { data: mascotas, error: mascotasError } = await supabase
    .from("mascotas")
    .select("id")
    .eq(ownerColumn, empresaId);

  if (mascotasError) {
    console.error(
      "[api/adopciones/empresa][GET] Error obteniendo mascotas:",
      supabaseErrorToJson(mascotasError)
    );
    return Response.json(
      { error: supabaseErrorToJson(mascotasError) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const mascotaIds = (mascotas ?? []).map((m) => m.id);

  if (mascotaIds.length === 0) {
    return Response.json([], {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // 3. Obtener solicitudes de adopción para esas mascotas
  const { data, error } = await supabase
    .from("solicitudes_adopcion")
    .select(
      "id, estado, created_at, mensaje, telefono, direccion, usuario_id, mascota_id, usuarios(nombre,email), mascotas(nombre,especie,raza,edad,foto_url)"
    )
    .in("mascota_id", mascotaIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[api/adopciones/empresa][GET] Error obteniendo solicitudes:",
      supabaseErrorToJson(error)
    );
    return Response.json(
      { error: supabaseErrorToJson(error) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return Response.json(data ?? [], {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
