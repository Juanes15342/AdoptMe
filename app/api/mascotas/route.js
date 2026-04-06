import { createServerSupabaseClient } from "@/lib/supabaseServer";

const OWNER_CANDIDATE_COLUMNS = [
  "empresa_id",
  "empresa_usuario_id",
  "usuario_id",
  "owner_id",
  "creado_por",
];
const COMPANY_NAME_CANDIDATE_COLUMNS = [
  "empresa_nombre",
  "nombre_empresa",
  "publicado_por",
];

async function findOwnerColumn(supabase) {
  for (const column of OWNER_CANDIDATE_COLUMNS) {
    const { error } = await supabase.from("mascotas").select(`id, ${column}`).limit(1);
    if (!error) return column;
  }
  return null;
}

async function findCompanyNameColumnInMascotas(supabase) {
  for (const column of COMPANY_NAME_CANDIDATE_COLUMNS) {
    const { error } = await supabase.from("mascotas").select(`id, ${column}`).limit(1);
    if (!error) return column;
  }
  return null;
}

export async function GET(request) {
  const supabase = createServerSupabaseClient();
  const ownerColumn = await findOwnerColumn(supabase);
  const companyColumn = await findCompanyNameColumnInMascotas(supabase);

  // Soporta listado "solo mis mascotas" para empresa:
  // /api/mascotas?mine=1&userId=...&rol=empresa
  const requestUrl = new URL(request.url);
  const mine = requestUrl.searchParams.get("mine");
  const userId = requestUrl.searchParams.get("userId");
  const rol = (requestUrl.searchParams.get("rol") || "").toLowerCase();

  let query = supabase
    .from("mascotas")
    .select(
      companyColumn
        ? `id, nombre, especie, raza, edad, descripcion, foto_url, disponible, created_at, ${companyColumn}`
        : "id, nombre, especie, raza, edad, descripcion, foto_url, disponible, created_at"
    );

  if (mine === "1") {
    if (rol !== "empresa") {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!ownerColumn) {
      return Response.json(
        { error: "La tabla mascotas no tiene columna de propietario (empresa_id/usuario_id)." },
        { status: 500 }
      );
    }
    query = query.eq(ownerColumn, userId);
  } else {
    query = query.eq("disponible", true);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? [], { status: 200 });
}

export async function POST(request) {
  const supabase = createServerSupabaseClient();
  const ownerColumn = await findOwnerColumn(supabase);
  const companyColumn = await findCompanyNameColumnInMascotas(supabase);

  const body = await request.json();
  const {
    nombre,
    especie,
    raza,
    edad,
    descripcion,
    foto_url,
    usuario, // viene del cliente; se usa solo para validar rol de forma básica
  } = body ?? {};

  const rol = typeof usuario?.rol === "string" ? usuario.rol.toLowerCase() : "";
  const userId = usuario?.id ?? null;

  if (rol !== "empresa") {
    return Response.json(
      { error: "Solo una cuenta empresa puede publicar mascotas." },
      { status: 401 }
    );
  }
  if (!userId) {
    return Response.json({ error: "Usuario inválido para crear mascota." }, { status: 400 });
  }
  if (!ownerColumn) {
    return Response.json(
      { error: "Falta columna de propietario en mascotas (empresa_id/usuario_id)." },
      { status: 500 }
    );
  }

  if (!nombre || !especie) {
    return Response.json(
      { error: "nombre y especie son obligatorios" },
      { status: 400 }
    );
  }

  const insertPayload = {
    nombre: String(nombre).trim(),
    especie: String(especie).trim(),
    raza: raza ? String(raza).trim() : null,
    edad: edad ? String(edad).trim() : null,
    descripcion: descripcion ? String(descripcion).trim() : null,
    foto_url: foto_url ? String(foto_url).trim() : null,
    disponible: true,
    [ownerColumn]: userId,
  };
  const companyName =
    typeof usuario?.nombre_empresa === "string" && usuario.nombre_empresa.trim()
      ? usuario.nombre_empresa.trim()
      : typeof usuario?.nombre === "string" && usuario.nombre.trim()
        ? usuario.nombre.trim()
        : null;
  if (companyColumn && companyName) {
    insertPayload[companyColumn] = companyName;
  }

  const { data, error } = await supabase
    .from("mascotas")
    .insert(insertPayload)
    .select("id, nombre, especie, raza, edad, descripcion, foto_url, disponible, created_at")
    .single();

  if (error) {
    const msg = String(error.message || "");
    if (msg.toLowerCase().includes("row-level security")) {
      return Response.json(
        { error: "Supabase bloqueó el guardado por políticas RLS en la tabla mascotas." },
        { status: 403 }
      );
    }
    if (rol && rol !== "empresa") {
      return Response.json(
        { error: "Solo una cuenta empresa puede publicar mascotas." },
        { status: 401 }
      );
    }
    return Response.json({ error: msg || "Error al guardar mascota" }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}

