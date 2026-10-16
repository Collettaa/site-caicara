"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dia, Origem } from "@/lib/financeiro/resumo";

// Paleta categórica validada (dataviz, 16/10/2026): ordem fixa por origem, nunca por ranking.
// Três cores ficam abaixo de 3:1 no branco — por isso legenda escrita + tabela por dia na página.
export const COR_ORIGEM: Record<Origem, string> = {
  mensalidades: "#2a78d6",
  hybrid: "#eb6834",
  eventos: "#1baf7a",
  loja: "#eda100",
  pix_direto: "#e87ba4",
  outros: "#008300",
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brlCent = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Teto "redondo" do eixo e 3 marcas (0, metade, teto). */
function escala(max: number) {
  if (max <= 0) return { teto: 100, marcas: [0, 50, 100] };
  const pot = 10 ** Math.floor(Math.log10(max));
  const teto = Math.ceil(max / pot) * pot;
  return { teto, marcas: [0, teto / 2, teto] };
}

const W = 420;
const H = 260;
const M = { t: 12, r: 8, b: 28, l: 74 };
const larguraUtil = W - M.l - M.r;
const alturaUtil = H - M.t - M.b;

export function Legenda({ origens, nomes }: { origens: Origem[]; nomes: Record<Origem, string> }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-700">
      {origens.map((o) => (
        <li key={o} className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COR_ORIGEM[o] }} />
          {nomes[o]}
        </li>
      ))}
    </ul>
  );
}

/** Barras empilhadas por dia. Tocar numa barra mostra o dia; tocar de novo filtra a lista. */
export function BarrasPorDia({
  dias,
  origens,
  nomes,
  mes,
  diaAtivo,
}: {
  dias: Dia[];
  origens: Origem[];
  nomes: Record<Origem, string>;
  mes: string;
  diaAtivo: string | null;
}) {
  const router = useRouter();
  const [foco, setFoco] = useState<number | null>(null);
  const { teto, marcas } = escala(Math.max(...dias.map((d) => d.total)));
  const passo = larguraUtil / dias.length;
  const largura = Math.max(2, passo - 2); // 2px de folga entre barras
  const y = (v: number) => M.t + alturaUtil - (v / teto) * alturaUtil;
  const d = foco === null ? null : dias[foco];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-3xl" role="img" aria-label="Pago por dia, separado por origem">
        {marcas.map((m) => (
          <g key={m}>
            <line x1={M.l} x2={W - M.r} y1={y(m)} y2={y(m)} stroke="#e4e4e7" strokeWidth={1} />
            <text x={M.l - 6} y={y(m) + 4} textAnchor="end" fontSize={13} fill="#71717a">
              {brl(m)}
            </text>
          </g>
        ))}
        {dias.map((dia, i) => {
          const x = M.l + i * passo + 1;
          let base = y(0);
          const partes = origens.filter((o) => dia.porOrigem[o] > 0);
          return (
            <g key={dia.dia}>
              {partes.map((o, n) => {
                const h = (dia.porOrigem[o] / teto) * alturaUtil;
                base -= h;
                const topo = n === partes.length - 1;
                // segmento separado do de baixo por 2px; só o topo da pilha tem canto arredondado
                return (
                  <rect
                    key={o}
                    x={x}
                    y={base}
                    width={largura}
                    height={Math.max(0, h - (n > 0 ? 2 : 0))}
                    rx={topo ? Math.min(4, largura / 2) : 0}
                    fill={COR_ORIGEM[o]}
                    opacity={diaAtivo && diaAtivo !== dia.dia ? 0.35 : 1}
                  />
                );
              })}
              {(i + 1) % 5 === 0 || i === 0 ? (
                <text x={x + largura / 2} y={H - 8} textAnchor="middle" fontSize={13} fill="#71717a">
                  {i + 1}
                </text>
              ) : null}
              {/* área de toque maior que a barra */}
              <rect
                x={M.l + i * passo}
                y={M.t}
                width={passo}
                height={alturaUtil}
                fill="transparent"
                onMouseEnter={() => setFoco(i)}
                onMouseLeave={() => setFoco(null)}
                onClick={() => {
                  if (foco !== i) return setFoco(i);
                  const qs = new URLSearchParams({ mes });
                  if (diaAtivo !== dia.dia) qs.set("dia", dia.dia);
                  router.push(`/admin/financeiro?${qs}#quem-pagou`, { scroll: false });
                }}
              />
            </g>
          );
        })}
        <line x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} stroke="#a1a1aa" strokeWidth={1} />
      </svg>
      {d ? (
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 w-56 -translate-x-1/2 rounded-2xl bg-zinc-950 p-3 text-sm text-white shadow-lg">
          <p className="font-bold">
            Dia {Number(d.dia.slice(8, 10))} · {brlCent(d.total)}
          </p>
          {origens
            .filter((o) => d.porOrigem[o] > 0)
            .map((o) => (
              <p key={o} className="flex items-center justify-between gap-2 text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COR_ORIGEM[o] }} />
                  {nomes[o]}
                </span>
                {brlCent(d.porOrigem[o])}
              </p>
            ))}
          {d.total > 0 ? <p className="mt-1 text-xs text-zinc-400">toque de novo para ver quem pagou</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Acumulado do mês contra o mês anterior, no mesmo dia do mês. Uma escala só. */
export function Acumulado({
  atual,
  anterior,
  hojeDia,
  rotuloAtual,
  rotuloAnterior,
}: {
  atual: number[];
  anterior: number[];
  hojeDia: number | null; // mês corrente: corta a linha em hoje
  rotuloAtual: string;
  rotuloAnterior: string;
}) {
  const [foco, setFoco] = useState<number | null>(null);
  const atualAteHoje = hojeDia ? atual.slice(0, hojeDia) : atual;
  const n = Math.max(atual.length, anterior.length);
  const { teto, marcas } = escala(Math.max(...atualAteHoje, ...anterior, 0));
  const x = (i: number) => M.l + (i / Math.max(1, n - 1)) * larguraUtil;
  const y = (v: number) => M.t + alturaUtil - (v / teto) * alturaUtil;
  const caminho = (serie: number[]) => serie.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const COR_ATUAL = "#2a78d6";
  const COR_ANTERIOR = "#eb6834";

  return (
    <div className="relative">
      <ul className="mb-3 flex flex-wrap gap-x-4 text-sm text-zinc-700">
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5" style={{ background: COR_ATUAL }} /> {rotuloAtual}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 border-t-2 border-dashed" style={{ borderColor: COR_ANTERIOR }} /> {rotuloAnterior}
        </li>
      </ul>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full max-w-3xl"
        role="img"
        aria-label={`Acumulado de ${rotuloAtual} contra ${rotuloAnterior}`}
        onMouseLeave={() => setFoco(null)}
      >
        {marcas.map((m) => (
          <g key={m}>
            <line x1={M.l} x2={W - M.r} y1={y(m)} y2={y(m)} stroke="#e4e4e7" strokeWidth={1} />
            <text x={M.l - 6} y={y(m) + 4} textAnchor="end" fontSize={13} fill="#71717a">
              {brl(m)}
            </text>
          </g>
        ))}
        {[1, 5, 10, 15, 20, 25, 30].filter((d) => d <= n).map((d) => (
          <text key={d} x={x(d - 1)} y={H - 8} textAnchor="middle" fontSize={13} fill="#71717a">
            {d}
          </text>
        ))}
        <path d={caminho(anterior)} fill="none" stroke={COR_ANTERIOR} strokeWidth={2} strokeDasharray="5 4" />
        <path d={caminho(atualAteHoje)} fill="none" stroke={COR_ATUAL} strokeWidth={2} />
        {foco !== null ? (
          <>
            <line x1={x(foco)} x2={x(foco)} y1={M.t} y2={M.t + alturaUtil} stroke="#a1a1aa" strokeWidth={1} />
            {foco < atualAteHoje.length ? <circle cx={x(foco)} cy={y(atualAteHoje[foco])} r={4} fill={COR_ATUAL} stroke="#fff" strokeWidth={2} /> : null}
            {foco < anterior.length ? <circle cx={x(foco)} cy={y(anterior[foco])} r={4} fill={COR_ANTERIOR} stroke="#fff" strokeWidth={2} /> : null}
          </>
        ) : null}
        {Array.from({ length: n }, (_, i) => (
          <rect
            key={i}
            x={x(i) - larguraUtil / n / 2}
            y={M.t}
            width={larguraUtil / n}
            height={alturaUtil}
            fill="transparent"
            onMouseEnter={() => setFoco(i)}
            onClick={() => setFoco(i)}
          />
        ))}
      </svg>
      {foco !== null ? (
        <div className="pointer-events-none absolute left-1/2 top-8 z-10 w-56 -translate-x-1/2 rounded-2xl bg-zinc-950 p-3 text-sm text-white shadow-lg">
          <p className="font-bold">Até o dia {foco + 1}</p>
          {foco < atualAteHoje.length ? (
            <p className="text-zinc-300">
              {rotuloAtual}: {brlCent(atualAteHoje[foco])}
            </p>
          ) : null}
          {foco < anterior.length ? (
            <p className="text-zinc-300">
              {rotuloAnterior}: {brlCent(anterior[foco])}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
