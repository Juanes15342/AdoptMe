import Link from "next/link";

export default function PetCard({ mascota, adopcionSlot = null }) {
  const {
    id,
    nombre,
    especie,
    raza,
    edad,
    descripcion,
    foto_url: fotoUrl,
    empresa_nombre: empresaNombre,
  } = mascota;

  return (
    <article className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative h-64 w-full bg-stone-100 dark:bg-zinc-800">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-stone-400">
            Sin foto
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-100">
          {nombre}
        </h2>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          {empresaNombre ? `Publicado por: ${empresaNombre}` : "Publicado por: Empresa"}
        </p>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {[especie, raza].filter(Boolean).join(" · ")}
          {edad ? ` · ${edad}` : ""}
        </p>
        {descripcion ? (
          <p className="mt-2 line-clamp-3 min-h-[60px] flex-1 text-sm text-stone-600 dark:text-stone-400">
            {descripcion}
          </p>
        ) : null}
        {adopcionSlot ? (
          adopcionSlot
        ) : (
          <Link
            href={`/mascotas/${id}`}
            className="mt-4 inline-flex justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Ver detalle
          </Link>
        )}
      </div>
    </article>
  );
}