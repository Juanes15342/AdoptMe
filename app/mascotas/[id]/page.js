import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { title: "Mascota | AdoptMe" };
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("mascotas")
    .select("nombre, especie")
    .eq("id", id)
    .eq("disponible", true)
    .maybeSingle();

  if (!data?.nombre) {
    return { title: "Mascota | AdoptMe" };
  }

  return {
    title: `${data.nombre} — ${data.especie ?? "Mascota"} | AdoptMe`,
    description: `Ficha de ${data.nombre} en AdoptMe.`,
  };
}

export default async function MascotaDetallePage({ params }) {
  const { id } = await params;
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
  const { data: mascota, error } = await supabase
    .from("mascotas")
    .select("id, nombre, especie, raza, edad, descripcion, foto_url")
    .eq("id", id)
    .eq("disponible", true)
    .maybeSingle();

  if (error || !mascota) {
    notFound();
  }

  const fotoUrl = mascota.foto_url;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-background dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="mb-6">
          <Link
            href="/mascotas"
            className="text-sm font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-500 dark:hover:text-amber-400"
          >
            ← Volver al catálogo
          </Link>
        </p>

        <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative aspect-[16/10] w-full bg-stone-100 dark:bg-zinc-800 sm:aspect-[2/1]">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={mascota.nombre}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-stone-400 dark:text-zinc-500">
                Sin foto
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 sm:text-4xl">
              {mascota.nombre}
            </h1>
            <p className="mt-2 text-lg text-stone-600 dark:text-stone-400">
              {[mascota.especie, mascota.raza].filter(Boolean).join(" · ")}
              {mascota.edad ? ` · ${mascota.edad}` : ""}
            </p>

            {mascota.descripcion ? (
              <div className="mt-6 border-t border-stone-200 pt-6 dark:border-zinc-700">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  Sobre {mascota.nombre}
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-stone-700 dark:text-stone-300">
                  {mascota.descripcion}
                </p>
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}
