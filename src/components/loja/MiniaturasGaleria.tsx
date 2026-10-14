"use client";

interface Props {
  fotos: string[];
  nome: string;
  /** Prefixo dos ids das fotos da galeria: `${prefixo}-${i}`. */
  prefixo: string;
}

/** Miniaturas do celular: tocar leva a galeria até a foto. A terceira é a tabela de medidas. */
export function MiniaturasGaleria({ fotos, nome, prefixo }: Props) {
  if (fotos.length < 2) return null;

  function irPara(i: number) {
    const alvo = document.getElementById(`${prefixo}-${i}`);
    if (!alvo) return;
    const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    alvo.scrollIntoView({ behavior: calmo ? "auto" : "smooth", block: "nearest", inline: "center" });
  }

  return (
    <div className="flex flex-wrap gap-2 lg:hidden">
      {fotos.map((foto, i) => (
        <button
          key={foto}
          type="button"
          onClick={() => irPara(i)}
          aria-label={i === 2 ? "Tabela de medidas" : `Ver foto ${i + 1} de ${nome}`}
          className="h-16 w-16 shrink-0 border-2 border-zinc-500 bg-white p-0.5 hover:border-black"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto} alt="" loading="lazy" className="h-full w-full object-contain" />
        </button>
      ))}
    </div>
  );
}
