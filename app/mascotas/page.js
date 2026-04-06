import { createServerSupabaseClient } from "@/lib/supabaseServer";
import MascotasCatalogoCliente from "@/app/components/MascotasCatalogoCliente";

const OWNER_CANDIDATE_COLUMNS = [
  "empresa_id",
  "empresa_usuario_id",
  "usuario_id",
  "owner_id",
  "creado_por",
];
const COMPANY_NAME_CANDIDATE_COLUMNS = [
  "nombre_empresa",
  "empresa_nombre",
  "razon_social",
];

async function findOwnerColumn(supabase) {
  for (const column of OWNER_CANDIDATE_COLUMNS) {
    const { error } = await supabase.from("mascotas").select(`id, ${column}`).limit(1);
    if (!error) return column;
  }
  return null;
}

async function findCompanyColumnInUsuarios(supabase) {
  for (const column of COMPANY_NAME_CANDIDATE_COLUMNS) {
    const { error } = await supabase.from("usuarios").select(`id, ${column}`).limit(1);
    if (!error) return column;
  }
  return null;
}

export const metadata = {
  title: "Mascotas en adopción | AdoptMe",
  description: "Catálogo de mascotas disponibles para adopción",
};

export default async function MascotasPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Falta configurar Supabase en <code className="text-sm">.env.local</code>.
        </p>
      </div>
    );
  }

  const supabase = createServerSupabaseClient();
  const ownerColumn = await findOwnerColumn(supabase);
  const companyColumn = await findCompanyColumnInUsuarios(supabase);
  const baseColumns = "id, nombre, especie, raza, edad, descripcion, foto_url";
  const selectColumns = ownerColumn ? `${baseColumns}, ${ownerColumn}` : baseColumns;

  const { data: mascotas, error } = await supabase
    .from("mascotas")
    .select(selectColumns)
    .eq("disponible", true)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          No se pudo cargar el catálogo: {error.message}
        </p>
      </div>
    );
  }

  const getOwnerId = (mascota) => (ownerColumn ? mascota?.[ownerColumn] ?? null : null);

  const empresaIds = [...new Set((mascotas ?? []).map(getOwnerId).filter(Boolean))];
  let empresasMap = {};
  if (empresaIds.length) {
    const selectUsuarios = companyColumn
      ? `id, nombre, ${companyColumn}`
      : "id, nombre";
    const { data: empresas } = await supabase
      .from("usuarios")
      .select(selectUsuarios)
      .in("id", empresaIds);
    empresasMap = Object.fromEntries(
      (empresas ?? []).map((e) => [e.id, e?.[companyColumn] || e.nombre || "Empresa"])
    );
  }

  const mascotasConEmpresa = (mascotas ?? []).map((m) => ({
    ...m,
    empresa_nombre: empresasMap[getOwnerId(m)] || "Empresa",
  }));

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-background dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10">
          <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 sm:text-4xl">
            Mascotas en adopción
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Conoce a los animales que buscan familia.
          </p>
        </header>

        <MascotasCatalogoCliente mascotas={mascotasConEmpresa} />
      </div>
    </div>
  );
}