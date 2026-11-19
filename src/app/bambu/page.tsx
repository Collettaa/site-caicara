import type { Metadata } from "next";
import Image from "next/image";
import { InscricaoBambuForm } from "@/components/bambu/InscricaoBambuForm";
import { camisetaAberta, corridaBambu, disponiveis, listInscricoes, tamanhos } from "@/lib/corrida-bambu";
import fotoCamiseta from "../../../public/images/bambu/camiseta.jpg";
import logoBambu from "../../../public/images/bambu/logo-bambu-gastro.png";
import fotoNoite from "../../../public/images/bambu/noite.jpg";
import logoCaicara from "../../../public/images/logo.png";
import apoioBardega from "../../../public/images/bambu/apoio-bardega.png";
import apoioDentari from "../../../public/images/bambu/apoio-dentari.png";
import apoioEverbrew from "../../../public/images/bambu/apoio-everbrew.png";
import apoioInbox from "../../../public/images/bambu/apoio-inbox.png";
import apoioZip from "../../../public/images/bambu/apoio-zipideias.png";

const APOIO = [
  { src: apoioEverbrew, alt: "Everbrew Cervejaria" },
  { src: apoioInbox, alt: "Inbox Solutions" },
  { src: apoioZip, alt: "Zip Ideias Comunicação Visual" },
  { src: apoioDentari, alt: "Dentari Clinic" },
  { src: apoioBardega, alt: "Quiosque Bardega D'Boa" },
];

// A venda da camiseta depende do preço, do Pix e da data: confere a cada visita.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Corrida de inauguração do Bambu Gastro Bar | Inscrição grátis",
  description:
    "Corrida leve de inauguração do Bambu Gastro Bar com a Caiçara Fit: sexta, 27/11, às 20h, Av. Ayrton Senna, quiosque 47B, Itararé, São Vicente. Grátis, com pagode do Luty RJ na chegada.",
  alternates: { canonical: "/bambu" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/bambu",
    title: "Corrida de inauguração do Bambu Gastro Bar",
    description: "Sexta, 27/11, 20h, quiosque 47B do Itararé. Grátis, com pagode na chegada.",
    images: [{ url: "/images/bambu/noite.jpg", width: 1200, height: 1600, alt: "Bambu lotado à noite, de frente pro mar" }],
  },
};

// Cores do Bambu Gastro Bar: verde-mata #09300b (fundo do logo), amarelo do bambu #f0c94c,
// verde-folha #8dbb55, creme #fdf3c4. A pulseira de evento é o elemento que marca a página.
const PULSEIRA = ["Grátis", "Sexta 27/11", "20h", "Quiosque 47B", "Pagode na chegada"];

export default async function BambuPage() {
  const { dateLabel, hora, local, mapa, chegada, percurso } = corridaBambu;
  const quando = `${dateLabel}, às ${hora}`;
  const { valor, pedidoAteLabel, tecido, brinde, medidas } = corridaBambu.camiseta;
  const vendendo = camisetaAberta() && valor !== null;
  const livres = disponiveis(await listInscricoes());

  return (
    <div className="overflow-x-clip bg-[#09300b] text-[#fdf3c4]">
      {/* Abertura: o logo do bar manda, o nome do evento vem logo abaixo. */}
      <section className="px-4 pb-14 pt-24 sm:pt-28">
        <div className="mx-auto max-w-2xl">
          <Image src={logoBambu} alt="Bambu Gastro Bar" priority className="mx-auto h-auto w-full max-w-[420px]" />
          <h1 className="mt-10 font-heading text-5xl font-bold uppercase leading-[0.95] sm:text-7xl">
            Corrida de
            <br />
            inauguração
          </h1>
          <p className="mt-4 font-heading text-3xl font-semibold text-[#f0c94c]">{quando}</p>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-[#fdf3c4]/85">
            Uma corrida leve pra abrir a unidade nova do Bambu Gastro Bar, no Itararé. Cada um no seu ritmo. Na
            chegada, tem pagode do Luty RJ.
          </p>
          <a
            href="#inscricao"
            className="mt-8 inline-flex h-16 w-full items-center justify-center rounded-2xl border-2 border-[#fdf3c4] bg-[#f0c94c] px-8 font-heading text-xl font-bold uppercase text-[#09300b] shadow-[4px_4px_0_#fdf3c4] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#f0c94c] sm:w-auto"
          >
            Quero correr
          </a>
        </div>
      </section>

      {/* A pulseira do evento atravessando a tela. */}
      <div aria-hidden className="relative -mx-6 -rotate-3 py-2">
        <div className="flex items-center gap-6 whitespace-nowrap border-y-4 border-[#09300b] bg-[#f0c94c] py-4 pl-10 font-heading text-2xl font-bold uppercase text-[#09300b] shadow-[0_6px_0_rgba(0,0,0,0.25)] sm:text-3xl">
          <span className="h-7 w-7 shrink-0 rounded-full border-4 border-[#09300b] bg-[#fdf3c4]" />
          {[...PULSEIRA, ...PULSEIRA, ...PULSEIRA].map((t, i) => (
            <span key={i} className="flex items-center gap-6">
              {t}
              <span className="text-[#8dbb55]">✦</span>
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only">Grátis, sexta 27/11, às 20h, no quiosque 47B do Itararé, com pagode na chegada.</p>

      {/* O que a pessoa precisa saber. */}
      <section className="px-4 pb-14 pt-16">
        <div className="mx-auto grid max-w-2xl gap-10 sm:grid-cols-[1fr_1fr] sm:items-start">
          <dl className="divide-y divide-[#fdf3c4]/15 border-y border-[#fdf3c4]/15">
            <Linha nome="Quando" valor={quando} />
            <Linha nome="Quanto" valor="Grátis" />
            <Linha nome="Ritmo" valor="O seu" />
            {chegada ? <Linha nome="Chegada" valor={chegada} /> : null}
            {local ? (
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="font-heading text-xl">Onde</dt>
                <dd className="text-right font-heading text-xl font-semibold">
                  <a href={mapa} target="_blank" rel="noopener noreferrer" className="text-[#f0c94c] underline decoration-2 underline-offset-4">
                    {local}
                  </a>
                </dd>
              </div>
            ) : null}
            {percurso ? <Linha nome="Percurso" valor={percurso} /> : null}
          </dl>
          <figure>
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] border-4 border-[#f0c94c]">
              <Image
                src={fotoNoite}
                alt="Bambu lotado à noite, de frente pro mar"
                fill
                sizes="(max-width: 640px) 100vw, 336px"
                className="object-cover object-[50%_70%]"
              />
            </div>
            <figcaption className="mt-3 font-[family-name:var(--font-marker)] text-xl text-[#8dbb55]">
              depois da corrida, a festa é no Bambu
            </figcaption>
          </figure>
        </div>
      </section>

      {/* A camiseta do evento: a etiqueta de tamanho é o elemento que se lê de perto. */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-4xl font-bold uppercase leading-none">Tem camiseta</h2>
          <p className="mt-3 max-w-md text-lg text-[#fdf3c4]/85">
            {tecido}, branca, com o Bambu na frente e a orla de São Vicente embaixo. Pedido até {pedidoAteLabel}, retira no
            dia da corrida.
          </p>
          <div className="mt-6 overflow-hidden rounded-3xl border-4 border-[#f0c94c]">
            <Image src={fotoCamiseta} alt="Camiseta da corrida, frente e costas, com os apoiadores" sizes="(max-width: 672px) 100vw, 672px" className="h-auto w-full" />
          </div>

          {/* Etiqueta de roupa: costura tracejada, tamanho e medidas. */}
          <div className="relative mx-auto mt-8 max-w-md -rotate-1 rounded-md bg-[#fdf3c4] p-2 text-[#09300b] shadow-[0_10px_0_rgba(0,0,0,0.3)]">
            <div className="rounded border-2 border-dashed border-[#09300b]/50 px-4 pb-4 pt-3">
              <p className="text-center font-heading text-2xl font-bold uppercase">Medidas</p>
              <p className="text-center text-sm">Em cm, peça na mesa: comprimento × largura.</p>
              <table className="mt-3 w-full text-left">
                <caption className="sr-only">Tamanhos da camiseta, medidas e quantas ainda tem</caption>
                <tbody>
                  {tamanhos.map((t) => (
                    <tr key={t} className="border-t border-[#09300b]/20">
                      <th scope="row" className="w-14 py-2 font-heading text-2xl font-bold">
                        {t}
                      </th>
                      <td className="py-2 font-heading text-xl tabular-nums">
                        {medidas[t][0]} × {medidas[t][1]}
                      </td>
                      <td className="py-2 text-right text-sm font-semibold">
                        {livres[t] === 0 ? <span className="text-red-700">esgotou</span> : livres[t] <= 5 ? `últimas ${livres[t]}` : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-8 font-heading text-2xl font-semibold text-[#f0c94c]">
            {vendendo ? `R$ ${valor}, no Pix ou no cartão (1x). Pede junto com a inscrição.` : "Venda abre em breve, aqui nesta página."}
          </p>
          {brinde ? (
            <p className="mt-2 font-[family-name:var(--font-marker)] text-xl text-[#8dbb55]">quem compra a camiseta ganha {brinde}</p>
          ) : null}
        </div>
      </section>

      {/* Inscrição. */}
      <section id="inscricao" className="scroll-mt-20 bg-[#8dbb55] px-4 py-14 text-[#09300b]">
        <div className="mx-auto max-w-xl">
          <h2 className="font-heading text-4xl font-bold uppercase">Inscrição</h2>
          <p className="mt-2 text-lg">{vendendo ? "Nome e WhatsApp. A camiseta é opcional." : "Nome e WhatsApp. Só isso."}</p>
          <div className="mt-6">
            {corridaBambu.inscricoesAbertas ? (
              <InscricaoBambuForm quando={quando} camiseta={vendendo ? { valor, pedidoAte: pedidoAteLabel, livres } : null} />
            ) : (
              <p className="rounded-3xl border-2 border-[#09300b] bg-[#fdf3c4] p-6 font-heading text-2xl font-bold uppercase">
                Inscrições encerradas
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Quem faz e quem apoia. */}
      <section className="px-4 pt-12">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-6">
          <Image src={logoCaicara} alt="Caiçara Fit" className="h-14 w-auto" />
          <span className="font-[family-name:var(--font-marker)] text-2xl text-[#8dbb55]">+</span>
          <Image src={logoBambu} alt="Bambu Gastro Bar" className="h-14 w-auto" />
        </div>
      </section>
      <section className="px-4 pb-12 pt-8">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white px-5 py-6">
          <h2 className="text-center font-heading text-2xl font-bold uppercase text-[#09300b]">Apoio</h2>
          <ul className="mt-4 grid grid-cols-3 items-center gap-x-4 gap-y-5 sm:grid-cols-5">
            {APOIO.map((item) => (
              <li key={item.alt} className="flex h-16 items-center justify-center">
                <Image src={item.src} alt={item.alt} sizes="120px" className="max-h-16 w-auto object-contain" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Linha({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-4">
      <dt className="font-heading text-xl">{nome}</dt>
      <dd className="text-right font-heading text-xl font-semibold text-[#f0c94c]">{valor}</dd>
    </div>
  );
}
