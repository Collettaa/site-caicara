import type { Metadata } from "next";
import Image from "next/image";
import { siteConfig } from "@/lib/site";
import { FadeIn } from "@/components/animations/FadeIn";
import { ArrowRight, CheckCircle2, Target, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre Nós | Conheça a Caiçara Fit",
  description:
    "Saiba mais sobre a nossa missão, valores e a equipe que faz a Caiçara Fit ser a melhor academia de crosstraining de São Vicente.",
  alternates: {
    canonical: "/sobre",
  },
};

export default function SobrePage() {
  return (
    <>
      <section className="bg-zinc-950 py-24 text-white sm:py-32">
        <div className="container px-4 text-center">
          <FadeIn>
            <h1 className="font-heading text-4xl font-black uppercase tracking-tight sm:text-6xl">
              Sobre a <span className="text-caicara-yellow">Caiçara Fit</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
              Mais do que um espaço de treino, somos uma comunidade dedicada a promover saúde, bem-estar e resultados reais através de uma metodologia segura e acolhedora em São Vicente.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-white py-20 text-zinc-950 sm:py-28">
        <div className="container px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <FadeIn direction="right">
              <div className="relative min-h-[400px] overflow-hidden rounded-[2rem] bg-zinc-100 sm:min-h-[500px]">
                <Image
                  src="/images/community.jpg"
                  alt="Nossa comunidade treinando junta"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </div>
            </FadeIn>

            <FadeIn>
              <h2 className="font-heading text-3xl font-black uppercase tracking-[-0.02em] sm:text-4xl">
                Nossa Missão
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-600">
                A Caiçara Fit nasceu com um propósito claro: democratizar o acesso a um treinamento físico de alta qualidade, provando que é possível alcançar excelentes resultados sem abrir mão da saúde e do respeito aos limites do corpo.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600">
                Acreditamos que o exercício deve ser uma parte natural e prazerosa da rotina. Por isso, estruturamos nossos treinos de crosstraining e treinamento funcional para atender desde iniciantes absolutos até atletas experientes, sempre com supervisão técnica atenta.
              </p>

              <div className="mt-8 grid gap-4">
                {[
                  { icon: Target, text: "Treinos adaptados à realidade de cada aluno." },
                  { icon: CheckCircle2, text: "Foco total na execução correta e prevenção de lesões." },
                  { icon: Heart, text: "Um ambiente onde todos se apoiam e evoluem juntos." },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-caicara-yellow/20 text-caicara-yellow-dark">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-zinc-800">{item.text}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-20 text-zinc-950 sm:py-28">
        <div className="container px-4">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-3xl font-black uppercase tracking-[-0.02em] sm:text-4xl">
                Nossa Estrutura e Identidade
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-600">
                Estamos localizados na Baixada Santista e respiramos o estilo de vida do litoral. Integrar as atividades indoor do nosso box com a energia dos beach sports e eventos ao ar livre é a nossa marca registrada.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-zinc-600">
                Nosso espaço conta com equipamentos modernos, área de musculação livre e uma equipe de profissionais de Educação Física registrados e preparados para garantir que você treine de forma intensa, porém totalmente segura.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="mx-auto mt-12 grid max-w-lg gap-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
              <h3 className="font-heading text-2xl font-black uppercase tracking-[-0.02em]">Onde nos encontrar</h3>
              <ul className="grid gap-4 text-zinc-600">
                <li>
                  <strong className="block text-zinc-900">Endereço Oficial:</strong>
                  {siteConfig.address.streetAddress}, {siteConfig.address.locality} - {siteConfig.address.region}
                </li>
                <li>
                  <strong className="block text-zinc-900">Contato Direto:</strong>
                  {siteConfig.phoneDisplay}
                </li>
                <li>
                  <strong className="block text-zinc-900">Redes Sociais Oficiais:</strong>
                  <a href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-caicara-yellow-dark hover:underline">
                    {siteConfig.instagramHandle}
                  </a>
                </li>
              </ul>
              <a
                href={siteConfig.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-zinc-800"
              >
                Falar com a equipe <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
