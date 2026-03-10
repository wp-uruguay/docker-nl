import AgentCard from "@/components/AgentCard";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="py-6 md:py-10 text-center">
        <div className="mx-auto w-[120px] md:w-[150px] nl-fade-in-down">
          {/* SVG isotipo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://nl360.site/wp-content/uploads/2026/01/Isotipo-NL360-Black.svg"
            alt="NL360 Isotipo"
            className="w-full h-auto nl-slow-rotate"
          />
        </div>

        <h2 className="mt-6 text-2xl md:text-3xl font-semibold text-zinc-900">
          NextLevel BackOffice 360
        </h2>
        <h4 className="mt-2 text-base md:text-lg font-medium text-zinc-500">
          Tu aliado en inteligencia artificial y automatizaciones
        </h4>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AgentCard
          title="Manu"
          description="Brandbook + generación de sitio en WP Multisite."
          href="/services/manu"
          icon="magic"
        />
        <AgentCard
          title="Margarita"
          description="Marketing: contenido, ads, email y automatización."
          href="/services/vilma"
          icon="bullhorn"
        />
        <AgentCard
          title="Jordan"
          description="Ventas: leads, filtros, closer y estrategia."
          href="/services/grant"
          icon="handshake"
        />
        <AgentCard
          title="MentorIA"
          description="Mentores: cursos en PDF/video convertidos a chat."
          href="/services/mentoria"
          icon="graduation"
        />
      </section>
    </div>
  );
}
