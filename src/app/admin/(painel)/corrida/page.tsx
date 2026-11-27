import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { exigirAdmin } from "@/lib/admin-auth";
import { corridaBambu, descreverItens, formatWhatsapp, listInscricoes, tamanhos } from "@/lib/corrida-bambu";
import { TREINAO_LINK_ATE, tokenTreinao, total, type VendaTreinao } from "@/lib/treinao-camisetas";
import { dadosDoTreinao } from "@/lib/treinao-camisetas-dados";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Treinão" };

function Zap({ whatsapp, nome }: { whatsapp: string; nome: string }) {
  if (!whatsapp) return null;
  return (
    <a
      href={`https://wa.me/${whatsapp}`}
      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-black"
      aria-label={`WhatsApp de ${nome}`}
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}

const SITUACAO: Record<VendaTreinao["situacao"], [string, string]> = {
  entregar: ["pago · falta entregar", "bg-amber-100 text-amber-800"],
  sem_peca: ["pago SEM PEÇA · trocar tamanho", "bg-red-100 text-red-800"],
  entregue: ["entregue", "bg-green-100 text-green-800"],
};

export default async function CorridaAdminPage() {
  await exigirAdmin();
  // Mesma conta do link da entrega: loja (desde 25/11) + /bambu antigo, estoque da loja.
  const { vendas, estoque, resumo: r, aguardando, pendentesBambu } = await dadosDoTreinao();
  const inscritos = (await listInscricoes()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const lista = [...vendas].sort((a, b) => (b.pagoEm ?? "").localeCompare(a.pagoEm ?? ""));
  const linkEntrega = `https://caicara.store/camisetas-treinao/${tokenTreinao()}`;
  const [, mes, dia] = TREINAO_LINK_ATE.split("-");

  return (
    <div className="container max-w-2xl py-6">
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Treinão do Bambu Gastro Bar</h1>
      <p className="mt-1 text-zinc-600">
        {corridaBambu.dateLabel}, {corridaBambu.hora} · camiseta vendida na loja (caicara.store/loja/{corridaBambu.camiseta.slugLoja})
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-3xl bg-caicara-yellow p-4">
          <p className="font-heading text-5xl font-black leading-none">{inscritos.length}</p>
          <p className="mt-1 text-sm font-bold">inscritos</p>
        </div>
        <div className="rounded-3xl bg-zinc-900 p-4 text-white">
          <p className="font-heading text-5xl font-black leading-none">{total(r.vendidas)}</p>
          <p className="mt-1 text-sm font-bold">camisetas pagas</p>
        </div>
        <div className="rounded-3xl bg-zinc-100 p-4">
          <p className="font-heading text-5xl font-black leading-none">{total(r.entregues)}</p>
          <p className="mt-1 text-sm font-bold">entregues</p>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-3xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-2">Tamanho</th>
              <th className="px-4 py-2 text-right">Pagas</th>
              <th className="px-4 py-2 text-right">Entregues</th>
              <th className="px-4 py-2 text-right">Falta entregar</th>
              <th className="px-4 py-2 text-right">Sobram na loja</th>
            </tr>
          </thead>
          <tbody>
            {tamanhos.map((t) => (
              <tr key={t} className="border-t border-zinc-100">
                <th className="px-4 py-2 font-bold">{t}</th>
                <td className="px-4 py-2 text-right font-bold tabular-nums">{r.vendidas[t] ?? 0}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.entregues[t] ?? 0}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.faltam[t] ?? 0}</td>
                <td className="px-4 py-2 text-right tabular-nums text-zinc-500">{estoque[t] ?? 0}</td>
              </tr>
            ))}
            <tr className="border-t border-zinc-200 bg-zinc-50 font-bold">
              <th className="px-4 py-2">Total</th>
              <td className="px-4 py-2 text-right tabular-nums">{total(r.vendidas)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{total(r.entregues)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{total(r.faltam)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{total(estoque)}</td>
            </tr>
          </tbody>
        </table>
        <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500">
          {total(aguardando) ? `${total(aguardando)} peça(s) aguardando pagamento (não entram em "pagas"). ` : ""}
          Pago com atraso entra sozinho. Estoque para repor: aba Produtos.
        </p>
      </div>

      <div className="mt-3 rounded-3xl border border-zinc-200 bg-white p-4 text-sm">
        <p className="font-bold">Link de quem entrega (sem senha, só essa camiseta, vale até {dia}/{mes})</p>
        <a href={linkEntrega} className="mt-1 block break-all text-blue-700 underline">
          {linkEntrega}
        </a>
      </div>

      <h2 className="mt-8 font-heading text-2xl font-black uppercase">Camisetas pagas · {lista.length} pedidos</h2>
      <ul className="mt-3 grid gap-2">
        {lista.map((v) => {
          const [texto, cor] = SITUACAO[v.situacao];
          return (
            <li key={v.chave} className="flex items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white p-4">
              <div>
                <p className="text-lg font-bold">{v.nome}</p>
                <p className="text-sm text-zinc-600">{v.whatsapp ? formatWhatsapp(v.whatsapp) : "sem WhatsApp"}</p>
                <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${cor}`}>
                  {Object.entries(v.itens)
                    .map(([t, n]) => `${n} ${t}`)
                    .join(", ")}{" "}
                  · {texto} · {v.origem === "loja" ? "loja" : "/bambu"}
                </p>
              </div>
              <Zap whatsapp={v.whatsapp} nome={v.nome} />
            </li>
          );
        })}
      </ul>
      {lista.length === 0 ? <p className="mt-3 text-zinc-500">Nenhuma camiseta paga ainda.</p> : null}

      {pendentesBambu.length > 0 ? (
        <>
          <h2 className="mt-8 font-heading text-xl font-black uppercase text-zinc-500">Não pagaram (/bambu antigo)</h2>
          <ul className="mt-3 grid gap-2">
            {pendentesBambu.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-3xl bg-zinc-100 p-4 text-zinc-600">
                <div>
                  <p className="font-bold">{p.nome}</p>
                  <p className="text-sm">
                    {descreverItens(p.itens)} · {p.forma === "cartao" ? "cartão" : "Pix"} · pendente no Asaas
                  </p>
                </div>
                <Zap whatsapp={p.whatsapp} nome={p.nome} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2 className="mt-8 font-heading text-2xl font-black uppercase">Inscritos</h2>
      <ul className="mt-3 grid gap-2">
        {inscritos.map((i) => (
          <li key={i.whatsapp} className="flex items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white p-4">
            <div>
              <p className="text-lg font-bold">{i.nome}</p>
              <p className="text-sm text-zinc-600">{formatWhatsapp(i.whatsapp)}</p>
            </div>
            <Zap whatsapp={i.whatsapp} nome={i.nome} />
          </li>
        ))}
      </ul>
      {inscritos.length === 0 ? <p className="mt-3 text-zinc-500">Ninguém inscrito ainda.</p> : null}
    </div>
  );
}
