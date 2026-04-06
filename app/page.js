import Image from "next/image";
import HomeGuestCTA from "@/app/components/HomeGuestCTA";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full">
      {/* Hero - Bienvenidos */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/80 to-stone-100 dark:from-stone-900 dark:via-amber-950/20 dark:to-stone-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d97706\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <div className="mb-8 flex justify-center">
            <Image
              src="/logo.png"
              alt="Adopt Me - Adoptar es amar"
              width={160}
              height={160}
              className="h-32 w-32 rounded-full object-contain sm:h-40 sm:w-40"
              priority
            />
          </div>
          <h1 className="mb-8 text-center font-serif text-4xl font-bold tracking-tight text-stone-800 dark:text-stone-100 sm:text-5xl">
            Bienvenidos
          </h1>
          <div className="space-y-5 text-lg leading-relaxed text-stone-700 dark:text-stone-300">
            <p>
              Bienvenidos a Adopt Me, una plataforma creada con el propósito de
              ayudar a perros y gatos que se encuentran en situación de abandono
              a encontrar un hogar lleno de amor y cuidado. Nuestro proyecto nace
              con la idea de utilizar la tecnología para conectar a las mascotas
              que necesitan una familia con personas responsables que desean
              adoptar y brindarles una segunda oportunidad de vida.
            </p>
            <p>
              El proyecto Adopt Me se diferencia porque no solo busca publicar
              mascotas en adopción, sino también asegurar su bienestar después de
              encontrar un hogar. La plataforma incluirá un sistema de seguimiento
              posterior a la adopción para verificar que las mascotas se adapten
              bien a su nueva familia y reciban los cuidados necesarios. Además,
              se promoverán jornadas de vacunación y desparasitación según las
              necesidades de cada animal, fomentando siempre la adopción
              responsable. También se contempla la posibilidad de establecer
              convenios con el municipio y entidades locales para fortalecer las
              campañas de adopción y el cuidado de los animales. Por esto, Adopt
              Me no será solo una página para publicar mascotas, sino una
              herramienta tecnológica con impacto social orientada a reducir el
              abandono y promover la tenencia responsable de mascotas.
            </p>
          </div>

        </div>
      </section>

      {/* Misión */}
      <section className="border-t border-stone-200/80 bg-[#fffef8] dark:border-stone-700 dark:bg-stone-950">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <div className="mb-10 flex items-center gap-3">
            <span className="flex h-10 w-1 rounded-full bg-amber-500" />
            <h2 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 sm:text-4xl">
              Misión
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-stone-600 dark:text-stone-400">
            <p>
              La misión de Adopt Me es ayudar a perros y gatos que se encuentran
              en situación de abandono a encontrar un hogar seguro, responsable
              y lleno de amor. A través de nuestra plataforma digital buscamos
              conectar a las personas que desean adoptar mascotas que necesitan
              una segunda oportunidad de vida.
            </p>
            <p>
              Nuestro objetivo es facilitar el proceso de adopción de manera
              sencilla, confiable y accesible, brindando información clara sobre
              cada mascota, sus características, estado de salud y necesidades.
              Además, promovemos la adopción responsable y la conciencia sobre
              el cuidado, respeto y protección de los animales.
            </p>
            <p>
              Con este proyecto también buscamos apoyar a refugios, rescatistas
              y organizaciones que trabajan por el bienestar animal, ayudándoles
              a dar mayor visibilidad a las mascotas que esperan una familia.
            </p>
          </div>
        </div>
      </section>

      {/* Visión */}
      <section className="border-t border-stone-200/80 bg-amber-50/40 dark:border-stone-700 dark:bg-stone-900/50">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <div className="mb-10 flex items-center gap-3">
            <span className="flex h-10 w-1 rounded-full bg-amber-500" />
            <h2 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 sm:text-4xl">
              Visión
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-stone-600 dark:text-stone-400">
            <p>
              La visión de Adopt Me es convertirse en una plataforma reconocida
              por su compromiso con el bienestar animal y por facilitar procesos
              de adopción responsables a través de la tecnología. Aspiramos a
              crear una comunidad donde cada vez más personas se involucren en
              la protección y cuidado de los animales.
            </p>
            <p>
              A largo plazo, buscamos que nuestra plataforma permita reducir el
              número de mascotas abandonadas, brindando herramientas digitales
              que ayuden a encontrar hogares adecuados para cada animal. También
              queremos promover la educación sobre la tenencia responsable de
              mascotas y fomentar valores como el respeto, la empatía y la
              responsabilidad hacia los animales.
            </p>
            <p>
              Nuestro propósito es que Adopt Me crezca como un espacio confiable
              donde las personas puedan adoptar, informarse y contribuir al
              bienestar de miles de mascotas que necesitan una oportunidad para
              vivir en un entorno seguro y lleno de cariño.
            </p>
          </div>
        </div>
      </section>

      {/* Acerca de Nosotros */}
      <section className="border-t border-stone-200/80 bg-[#fffef8] dark:border-stone-700 dark:bg-stone-950">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <div className="mb-10 flex items-center gap-3">
            <span className="flex h-10 w-1 rounded-full bg-amber-500" />
            <h2 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 sm:text-4xl">
              Acerca de Nosotros
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-stone-600 dark:text-stone-400">
            <p>
              Adopt Me es una plataforma web creada con el objetivo de ayudar a
              perros y gatos que han sido abandonados o que necesitan un hogar.
              Nuestro proyecto busca conectar a estas mascotas con personas
              responsables que estén dispuestas a brindarles amor, cuidado y una
              segunda oportunidad de vida.
            </p>
            <p>
              A través de esta página, los usuarios pueden conocer información
              sobre diferentes mascotas disponibles para adopción, como su
              nombre, características, edad y personalidad. De esta manera, se
              facilita el proceso de encontrar una mascota que se adapte al
              estilo de vida de cada familia.
            </p>
            <p>
              Además, Adopt Me busca promover la adopción responsable y generar
              conciencia sobre la importancia de cuidar y respetar a los
              animales. Muchas mascotas se encuentran en situación de abandono,
              y mediante esta plataforma queremos contribuir a reducir este
              problema, ayudando a que más animales puedan encontrar un hogar
              seguro.
            </p>
            <p>
              En Adopt Me, creemos que cada mascota merece una oportunidad para
              vivir en un hogar donde sea cuidada, respetada y considerada parte
              de la familia.
            </p>
          </div>
        </div>
      </section>

      <HomeGuestCTA />
    </div>
  );
}
