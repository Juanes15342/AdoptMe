"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomeGuestCTA() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const readUsuario = () => {
      try {
        const stored = window.sessionStorage.getItem("adoptme_user");
        setUsuario(stored ? JSON.parse(stored) : null);
      } catch {
        setUsuario(null);
      }
    };

    readUsuario();
    window.addEventListener("adoptme-auth-changed", readUsuario);
    window.addEventListener("storage", readUsuario);

    return () => {
      window.removeEventListener("adoptme-auth-changed", readUsuario);
      window.removeEventListener("storage", readUsuario);
    };
  }, []);

  if (usuario) return null;

  return (
    <section className="border-t border-stone-200/80 bg-amber-600 dark:border-stone-700 dark:bg-amber-700">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <p className="mb-6 text-center text-lg font-medium text-amber-50">
          ¿Quieres adoptar o ser parte del cambio?
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login?rol=usuario"
            className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-amber-800 shadow-md transition hover:bg-amber-50"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="inline-flex items-center rounded-full border-2 border-amber-50 bg-transparent px-6 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-50 hover:text-amber-800"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </section>
  );
}
