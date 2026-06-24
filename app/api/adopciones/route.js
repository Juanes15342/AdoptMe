import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSearchParams(request) {
  try {
    const { searchParams } = new URL(request.url);
    return searchParams;
  } catch {
    return new URLSearchParams();
  }
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

const OWNER_CANDIDATE_COLUMNS = [
  "empresa_id",
  "empresa_usuario_id",
  "usuario_id",
  "owner_id",
  "creado_por",
];

async function findOwnerColumn(supabase) {
  for (const column of OWNER_CANDIDATE_COLUMNS) {
    const { error } = await supabase.from("mascotas").select(`id, ${column}`).limit(1);
    if (!error) return column;
  }
  return null;
}

// GET - listar solicitudes (opcionalmente filtrar por usuario_id / estado / empresa_id)
export async function GET(request) {
  const supabase = createServerSupabaseClient();
  const searchParams = getSearchParams(request);
  const usuarioId = searchParams.get("usuario_id");
  const estado = searchParams.get("estado");
  const empresaId = searchParams.get("empresa_id");

  let query = supabase
    .from("solicitudes_adopcion")
    .select(
      "id, estado, created_at, mensaje, telefono, direccion, usuario_id, mascota_id, usuarios(nombre,email), mascotas(nombre,especie,raza,edad,foto_url)"
    )
    .order("created_at", { ascending: false });

  if (usuarioId) query = query.eq("usuario_id", usuarioId);
  if (estado) query = query.eq("estado", estado);

  if (empresaId) {
    const ownerColumn = await findOwnerColumn(supabase);
    if (ownerColumn) {
      const { data: minePets, error: petsError } = await supabase
        .from("mascotas")
        .select("id")
        .eq(ownerColumn, empresaId);

      if (petsError) {
        console.error("[api/adopciones][GET] error fetching company pets:", petsError);
      }

      const petIds = (minePets ?? []).map((p) => p.id);
      if (petIds.length > 0) {
        query = query.in("mascota_id", petIds);
      } else {
        // La empresa no tiene mascotas, devolver vacío
        return Response.json([], {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        });
      }
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("[api/adopciones][GET] Supabase error:", supabaseErrorToJson(error));
    return Response.json(
      { error: supabaseErrorToJson(error) },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  return Response.json(data ?? [], {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

// POST - crear solicitud (por defecto queda en "pendiente")
export async function POST(request) {
  const supabase = createServerSupabaseClient();
  let body = null;
  try {
    body = await request.json();
  } catch (e) {
    console.error("[api/adopciones][POST] Invalid JSON body:", e);
    return Response.json({ error: { message: "Body JSON inválido" } }, { status: 400 });
  }

  const {
    usuario_id: usuarioId,
    mascota_id: mascotaId,
    mensaje,
    telefono,
    direccion,
  } = body ?? {};

  if (!usuarioId || !mascotaId) {
    return Response.json(
      { error: "usuario_id y mascota_id son obligatorios" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const insertPayload = {
    usuario_id: usuarioId,
    mascota_id: mascotaId,
    estado: "pendiente",
    mensaje: typeof mensaje === "string" ? mensaje.trim() : null,
    telefono: typeof telefono === "string" ? telefono.trim() : null,
    direccion: typeof direccion === "string" ? direccion.trim() : null,
  };

  const { data, error } = await supabase
    .from("solicitudes_adopcion")
    .insert(insertPayload)
    .select(
      "id, estado, created_at, mensaje, telefono, direccion, usuario_id, mascota_id"
    )
    .single();

  if (error) {
    console.error("[api/adopciones][POST] Insert payload:", insertPayload);
    console.error("[api/adopciones][POST] Supabase error:", supabaseErrorToJson(error));
    return Response.json(
      { error: supabaseErrorToJson(error) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return Response.json(data, { status: 201, headers: { "Cache-Control": "no-store" } });
}

