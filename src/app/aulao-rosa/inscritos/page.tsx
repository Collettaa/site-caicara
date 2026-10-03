import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatWhatsapp, isPixPaid, listInscricoes, vinculoOptions, type Vinculo } from "@/lib/aulao-rosa";

export const metadata: Metadata = {
  title: "Inscritos Aulão Rosa",
  robots: { index: false, follow: false },
};

export default async function InscritosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { k } = await searchParams;
  const key = process.env.AULAO_LISTA_KEY;
  if (!key || k !== key) notFound();

  const inscricoes = (await listInscricoes()).reverse();
  const count = (v: Vinculo) => inscricoes.filter((i) => i.vinculo === v).length;

  // Status do Pix vem direto do Asaas na hora de abrir a lista.
  const pagos = new Map<string, boolean | null>(
    await Promise.all(
      inscricoes
        .filter((i) => i.pagamentoId)
        .map(async (i) => [i.pagamentoId!, await isPixPaid(i.pagamentoId!).catch(() => null)] as const),
    ),
  );
  const totalPago = [...pagos.values()].filter(Boolean).length;

  return (
    <section className="bg-white py-10 text-black">
      <div className="container px-4">
        <h1 className="font-heading text-4xl font-black uppercase tracking-tight">
          Aulão Rosa · {inscricoes.length} inscritos
        </h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          {(Object.keys(vinculoOptions) as Vinculo[]).map((v) => (
            <span key={v} className="rounded-full bg-zinc-100 px-3 py-1">
              {vinculoOptions[v]}: {count(v)}
            </span>
          ))}
          {pagos.size ? (
            <span className="rounded-full bg-pink-100 px-3 py-1 text-pink-700">
              Pix pagos: {totalPago} · R$ {totalPago * 15}
            </span>
          ) : null}
        </div>

        <ul className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200">
          {inscricoes.map((i) => (
            <li key={i.whatsapp} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-lg font-bold">{i.nome}</p>
                <p className="text-sm text-zinc-500">
                  {vinculoOptions[i.vinculo]}
                  {i.pagamentoId ? (
                    <strong className={pagos.get(i.pagamentoId) ? "text-green-600" : "text-amber-600"}>
                      {" "}
                      · {pagos.get(i.pagamentoId) ? "Pix pago" : pagos.get(i.pagamentoId) === null ? "Pix ?" : "Pix pendente"}
                    </strong>
                  ) : null}{" "}
                  ·{" "}
                  {new Date(i.criadoEm).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <a
                href={`https://wa.me/${i.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
              >
                {formatWhatsapp(i.whatsapp)}
              </a>
            </li>
          ))}
        </ul>
        {inscricoes.length === 0 ? <p className="mt-6 text-zinc-500">Ninguém inscrito ainda.</p> : null}
      </div>
    </section>
  );
}
