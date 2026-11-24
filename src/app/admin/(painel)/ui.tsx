import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { vizinho } from "@/lib/caixa";

// Peças comuns das abas Caixa, Contas, Parcelados, Encomendas e Automações.

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dataCurta = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const diaSemana = (d: string) => SEMANA[new Date(`${d}T12:00:00Z`).getUTCDay()];
export const NOME_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const nomeMes = (mes: string) => `${NOME_MES[Number(mes.slice(5, 7)) - 1]} ${mes.slice(0, 4)}`;

export const campo = "h-14 w-full min-w-0 rounded-2xl border border-zinc-300 bg-white px-4 text-lg outline-none focus:border-black";
export const botaoPreto = "inline-flex h-14 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-bold uppercase tracking-[0.12em] text-white";
export const botaoClaro = "inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold uppercase tracking-[0.12em] ring-1 ring-zinc-300";

export function mesDe(v: string | undefined, hoje: string) {
  return v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : hoje.slice(0, 7);
}

export function MesNav({ rota, mes, titulo }: { rota: string; mes: string; titulo?: string }) {
  const bola = "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white ring-1 ring-zinc-200";
  return (
    <div className="flex items-center justify-between gap-3">
      <Link href={`${rota}?mes=${vizinho(mes, -1)}`} className={bola} aria-label="Mês anterior">
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-center font-heading text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
        {titulo ? <span className="block text-base tracking-[0.08em] text-zinc-500">{titulo}</span> : null}
        {nomeMes(mes)}
      </h1>
      <Link href={`${rota}?mes=${vizinho(mes, 1)}`} className={bola} aria-label="Próximo mês">
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  );
}

export function Secao({ titulo, children, id, extra }: { titulo: string; children: React.ReactNode; id?: string; extra?: React.ReactNode }) {
  return (
    <section id={id} className="mt-6 scroll-mt-24 rounded-3xl bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-black uppercase">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

export function Recado({ tipo, children }: { tipo: "ok" | "erro"; children: React.ReactNode }) {
  return (
    <p role="status" className={`mt-4 rounded-2xl p-4 font-semibold ${tipo === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
      {children}
    </p>
  );
}
