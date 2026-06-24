import Link from "next/link";

export default function MascotaNotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="font-serif text-2xl font-bold text-stone-800 dark:text-stone-100">
        Mascota no encontrada
      </h1>
      <p className="mt-3 text-stone-600 dark:text-stone-400">
        No existe o ya no está disponible para adopción.
      </p>
      <Link
        href="/mascotas"
        className="mt-8 inline-flex rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700"
      >
        Ir al catálogo
      </Link>
    </div>
  );
}
