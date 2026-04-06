import { createServerSupabaseClient } from "@/lib/supabaseServer";
import PetCard from "@/app/components/PetCards";

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
  const { data: mascotas, error } = await supabase
    .from("mascotas")
    .select("id, nombre, especie, raza, edad, descripcion, foto_url")
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

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-stone-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10">
          <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 sm:text-4xl">
            Mascotas en adopción
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Conoce a los animales que buscan familia.
          </p>
        </header>

        {!mascotas?.length ? (
          <p className="rounded-xl border border-stone-200 bg-white px-6 py-10 text-center text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-stone-400">
            Aún no hay mascotas publicadas. Vuelve pronto.
          </p>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {mascotas.map((m) => (
              <li key={m.id}>
                <PetCard mascota={m} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}