import { createServerSupabaseClient } from "@/lib/supabaseServer";

const ESTADOS_VALIDOS = ["pendiente", "aprobado", "rechazado"];

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

