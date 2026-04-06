import { createServerSupabaseClient } from "@/lib/supabaseServer";

const ESTADOS_VALIDOS = ["pendiente", "aprobado", "rechazado"];

function getSearchParams(request) {
  try {
    return new URL(request.url).searchParams;
  } catch {
    return new URLSearchParams();
  }
}

// PUT - actualizar estado de una solicitud (empresa)
export async function PUT(request, { params }) {
  const supabase = createServerSupabaseClient();
  const { id } = await params;
  const body = await request.json();
  const { estado } = body ?? {};

  const estadoNormalizado =
    typeof estado === "string" ? estado.trim().toLowerCase() : "";

  if (!estadoNormalizado || !ESTADOS_VALIDOS.includes(estadoNormalizado)) {
    return Response.json(
      { error: `Estado no válido. Usa: ${ESTADOS_VALIDOS.join(", ")}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("solicitudes_adopcion")
    .update({ estado: estadoNormalizado })
    .eq("id", id)
    .select(
      "id, estado, created_at, mensaje, telefono, direccion, usuario_id, mascota_id"
    )
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 200 });
}

// DELETE - el adoptante cancela su propia solicitud (solo si está pendiente)
export async function DELETE(request, { params }) {
  const supabase = createServerSupabaseClient();
  const { id } = await params;

  let usuarioId = null;
  try {
    const body = await request.json();
    usuarioId = body?.usuario_id ?? null;
  } catch {
    // body opcional
  }
  if (!usuarioId) {
    try {
      usuarioId = getSearchParams(request).get("usuario_id");
    } catch {
      usuarioId = null;
    }
  }

  if (!usuarioId) {
    return Response.json(
      { error: "usuario_id es obligatorio" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { data: row, error: fetchErr } = await supabase
    .from("solicitudes_adopcion")
    .select("id, usuario_id, estado")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return Response.json(
      { error: fetchErr.message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!row) {
    return Response.json(
      { error: "Solicitud no encontrada" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (String(row.usuario_id) !== String(usuarioId)) {
    return Response.json(
      { error: "No autorizado" },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const estado = String(row.estado ?? "").trim().toLowerCase();
  if (estado !== "pendiente") {
    return Response.json(
      { error: "Solo se pueden cancelar solicitudes pendientes" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { error: delErr } = await supabase
    .from("solicitudes_adopcion")
    .delete()
    .eq("id", id);

  if (delErr) {
    return Response.json(
      { error: delErr.message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

