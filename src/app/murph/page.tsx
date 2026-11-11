import type { Metadata } from "next";
import Image from "next/image";
import { InscricaoMurphForm } from "@/components/murph/InscricaoMurphForm";
import { bateriasLivres, listInscricoes, murph, pixAtivo } from "@/lib/murph";
import fotoTreino from "../../../public/images/open-1.jpeg";

// Vagas por bateria mudam a cada inscrição.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Murph | Inscrição",
  description:
    "Murph na Caiçara Fit em São Vicente: sexta, 04/12, em 6 baterias ao longo do dia. Completo, em dupla ou meio Murph. Escolha sua bateria e faça a inscrição.",
  alternates: { canonical: "/murph" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/murph",
    title: "Murph na Caiçara Fit",
    description: "Sexta, 04/12. Escolhe a bateria: 6h, 8h, 12h, 16h, 18h30 ou 20h.",
    images: [{ url: "/images/open-1.jpeg", width: 1080, height: 1620, alt: "Aluna da Caiçara Fit no meio do treino" }],
  },
};

const treino = [
  { qtd: "1,6 km", nome: "Corrida" },
  { qtd: "100", nome: "Pull-ups" },
  { qtd: "200", nome: "Push-ups" },
  { qtd: "300", nome: "Air squats" },
  { qtd: "1,6 km", nome: "Corrida" },
];

const versoes = [
  { nome: "Completo", texto: "O treino inteiro, do jeito que ele é." },
  { nome: "Em dupla", texto: "Mesmo treino, repetições divididas com alguém." },
  { nome: "Meio Murph", texto: "Metade de tudo. Bom pra quem vai fazer o primeiro." },
];

// Sombra preta dura: o mesmo "adesivo" das etiquetas da loja.
const botaoAmarelo =
  "inline-flex h-16 w-full items-center justify-center rounded-2xl border-2 border-black bg-caicara-yellow px-6 font-heading text-xl font-bold uppercase text-black transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto";

export default async function MurphPage() {
  const livres = bateriasLivres(await listInscricoes());
  const valorFora = murph.inscricaoForaValor;

  return (
    <>
      {/* Abertura: foto do box e o nome em estêncil por cima. */}
      <section className="bg-black pt-16 text-white sm:pt-20">
        <div className="relative mx-auto max-w-3xl">
          <div className="relative aspect-[1/1] w-full sm:aspect-[16/10]">
            <Image
              src={fotoTreino}
              alt="Aluna da Caiçara Fit suada, no meio do treino"
              priority
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover object-[50%_30%] grayscale-[35%]"
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent" />
          </div>
          <div className="relative -mt-40 px-4 pb-10 sm:-mt-48">
            <h1 className="font-[family-name:var(--font-estencil)] text-[5.5rem] leading-[0.85] text-caicara-yellow sm:text-[9rem]">
              Murph
            </h1>
            <p className="mt-4 max-w-md font-heading text-2xl font-semibold leading-tight sm:text-3xl">
              Sexta, 4 de dezembro. Seis baterias, das 6h às 20h.
            </p>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-zinc-300">
              O treino-homenagem mais famoso do mundo, com a galera do box do lado. Escolhe a versão e o horário.
            </p>
            <a href="#inscricao" className={`mt-8 ${botaoAmarelo} shadow-[4px_4px_0_#fff]`}>
              {murph.inscricoesAbertas ? "Escolher minha bateria" : "Inscrições encerradas"}
            </a>
          </div>
        </div>
      </section>

      {/* O treino como no quadro do box. */}
      <section className="bg-black px-4 pb-16 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border-2 border-zinc-800 p-6 sm:p-10">
          <h2 className="font-heading text-3xl font-bold uppercase">O treino</h2>
          <ol className="mt-6 divide-y divide-zinc-800">
            {treino.map((item, n) => (
              <li key={n} className="flex items-baseline gap-5 py-3">
                <span className="w-28 shrink-0 font-[family-name:var(--font-estencil)] text-4xl text-caicara-yellow sm:w-36 sm:text-5xl">
                  {item.qtd}
                </span>
                <span className="font-heading text-2xl font-medium sm:text-3xl">{item.nome}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-zinc-400">Nessa ordem, contra o relógio. Cada um no seu ritmo.</p>
        </div>
      </section>

      {/* A história, num bilhete preso com fita. */}
      <section className="bg-caicara-yellow px-4 py-16 text-black">
        <div className="mx-auto max-w-xl">
          <div className="relative -rotate-1 rounded-sm bg-[#fbf7ee] px-6 pb-8 pt-10 shadow-[6px_6px_0_#000]">
            <span aria-hidden className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 rotate-2 bg-black/80" />
            <h2 className="font-[family-name:var(--font-marker)] text-3xl">Quem foi o Murph?</h2>
            <div className="mt-4 grid gap-3 text-[1.05rem] leading-relaxed text-zinc-800">
              <p>
                Michael Murphy era tenente dos Navy SEALs, a tropa de elite da Marinha americana. Em 2005, no
                Afeganistão, ele morreu aos 29 anos tentando salvar os companheiros e ganhou a Medalha de Honra.
              </p>
              <p>
                O treino preferido dele se chamava Body Armor. Depois, virou Murph, e hoje é feito no mundo inteiro
                como homenagem.
              </p>
              <p>Aqui no box, a gente faz junto. Ninguém termina sozinho.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Versões e quem paga. */}
      <section className="bg-white px-4 py-16 text-black">
        <div className="mx-auto grid max-w-3xl gap-12 sm:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl font-bold uppercase">Do seu jeito</h2>
            <dl className="mt-5 divide-y divide-zinc-200 border-y border-zinc-200">
              {versoes.map((v) => (
                <div key={v.nome} className="py-4">
                  <dt className="font-heading text-xl font-semibold">{v.nome}</dt>
                  <dd className="text-zinc-600">{v.texto}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="font-heading text-3xl font-bold uppercase">Quanto custa</h2>
            <dl className="mt-5 divide-y divide-zinc-200 border-y border-zinc-200">
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="font-heading text-xl font-semibold">Aluno Caiçara</dt>
                <dd className="font-heading text-xl font-bold">Grátis</dd>
              </div>
              <div className="py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-heading text-xl font-semibold">TotalPass</dt>
                  <dd className="font-heading text-xl font-bold">Grátis</dd>
                </div>
                <p className="text-zinc-600">Faz o check-in no dia.</p>
              </div>
              <div className="py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-heading text-xl font-semibold">De fora</dt>
                  <dd className="font-heading text-xl font-bold">R$ {valorFora}</dd>
                </div>
                <p className="text-zinc-600">No Pix, na inscrição. Quem leva a camiseta do Murph já está inscrito.</p>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section id="inscricao" className="scroll-mt-20 bg-zinc-100 px-4 py-16 text-black">
        <div className="mx-auto max-w-xl">
          <h2 className="font-heading text-4xl font-bold uppercase">
            {murph.inscricoesAbertas ? "Inscrição" : "Lista fechada"}
          </h2>
          <p className="mt-2 text-lg text-zinc-600">
            Até {murph.vagasPorBateria} pessoas por bateria. Bateria cheia sai da lista.
          </p>
          <div className="mt-6">
            {murph.inscricoesAbertas ? (
              <InscricaoMurphForm
                livresIniciais={livres}
                whatsappFinal={murph.whatsappFinal}
                dateLabel={murph.dateLabel}
                pixAtivo={pixAtivo()}
                valorFora={valorFora}
              />
            ) : (
              <div className="rounded-3xl border-2 border-black bg-white p-8">
                <p className="font-heading text-3xl font-bold uppercase">Inscrições encerradas</p>
                <p className="mt-4 text-lg leading-relaxed text-zinc-700">
                  Valeu, galera! Quem se inscreveu: {murph.dateLabel.toLowerCase()}, na bateria escolhida.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
