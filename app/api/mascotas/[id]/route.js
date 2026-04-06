import { createServerSupabaseClient } from "@/lib/supabaseServer";

const OWNER_CANDIDATE_COLUMNS = [
  "empresa_id",
  "empresa_usuario_id",
  "usuario_id",
  "owner_id",
  "creado_por",
];

function isEmpresa(usuario) {
  return typeof usuario?.rol === "string" && usuario.rol.toLowerCase() === "empresa";
}

async function findOwnerColumn(supabase) {
  for (const column of OWNER_CANDIDATE_COLUMNS) {
    const { error } = await supabase.from("mascotas").select(`id, ${column}`).limit(1);
    if (!error) return column;
  }
  return null;
}

export async function PUT(request, { params }) {
  const supabase = createServerSupabaseClient();
  const { id } = await params;
  const body = await request.json();
  const { usuario, ...fields } = body ?? {};

  if (!isEmpresa(usuario)) {
    return Response.json({ error: "Solo empresa puede editar mascotas" }, { status: 401 });
  }
  const ownerColumn = await findOwnerColumn(supabase);
  if (!ownerColumn) {
    return Response.json(
      { error: "La tabla mascotas no tiene columna de propietario." },
      { status: 500 }
    );
  }
  const userId = usuario?.id;
  if (!userId) {
    return Response.json({ error: "Usuario inválido." }, { status: 400 });
  }

  const { data: actual, error: readError } = await supabase
    .from("mascotas")
    .select(`id, ${ownerColumn}`)
    .eq("id", id)
    .maybeSingle();
  if (readError || !actual) {
    return Response.json({ error: "Mascota no encontrada." }, { status: 404 });
  }
  if (String(actual?.[ownerColumn]) !== String(userId)) {
    return Response.json(
      { error: "No puedes editar mascotas de otra empresa." },
      { status: 403 }
    );
  }

  const updatePayload = {
    nombre: fields.nombre ? String(fields.nombre).trim() : null,
    especie: fields.especie ? String(fields.especie).trim() : null,
    raza: fields.raza ? String(fields.raza).trim() : null,
    edad: fields.edad ? String(fields.edad).trim() : null,
    descripcion: fields.descripcion ? String(fields.descripcion).trim() : null,
    foto_url: fields.foto_url ? String(fields.foto_url).trim() : null,
  };

  const { data, error } = await supabase
    .from("mascotas")
    .update(updatePayload)
    .eq("id", id)
    .eq(ownerColumn, userId)
    .select("id, nombre, especie, raza, edad, descripcion, foto_url, disponible, created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 200 });
}

export async function DELETE(request, { params }) {
  const supabase = createServerSupabaseClient();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const usuario = body?.usuario;

  if (!isEmpresa(usuario)) {
    return Response.json({ error: "Solo empresa puede eliminar mascotas" }, { status: 401 });
  }
  const ownerColumn = await findOwnerColumn(supabase);
  if (!ownerColumn) {
    return Response.json(
      { error: "La tabla mascotas no tiene columna de propietario." },
      { status: 500 }
    );
  }
  const userId = usuario?.id;
  if (!userId) {
    return Response.json({ error: "Usuario inválido." }, { status: 400 });
  }

  const { data: actual, error: readError } = await supabase
    .from("mascotas")
    .select(`id, ${ownerColumn}`)
    .eq("id", id)
    .maybeSingle();
  if (readError || !actual) {
    return Response.json({ error: "Mascota no encontrada." }, { status: 404 });
  }
  if (String(actual?.[ownerColumn]) !== String(userId)) {
    return Response.json(
      { error: "No puedes eliminar mascotas de otra empresa." },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("mascotas")
    .delete()
    .eq("id", id)
    .eq(ownerColumn, userId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ message: "Mascota eliminada" }, { status: 200 });
}

