import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { exigirAdmin } from "@/lib/admin-auth";
import {
  conferirPedido,
  contarCamisetas,
  corridaBambu,
  descreverItens,
  disponiveis,
  formatWhatsapp,
  listInscricoes,
  listPedidos,
  tamanhos,
} from "@/lib/corrida-bambu";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Corrida" };

function Zap({ whatsapp, nome }: { whatsapp: string; nome: string }) {
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

export default async function CorridaAdminPage() {
  await exigirAdmin();
  // Ao abrir, confere no Asaas os pedidos de camiseta ainda pendentes.
  const pendentes = (await listPedidos()).filter((p) => !p.pago);
  await Promise.all(pendentes.map((p) => conferirPedido(p).catch(() => false)));

  const inscritos = (await listInscricoes()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const pedidos = (await listPedidos()).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const { pagas, aguardando } = contarCamisetas(pedidos);
  const livres = disponiveis(pedidos);
  const totalPagas = tamanhos.reduce((n, t) => n + pagas[t], 0);

  return (
    <div className="container max-w-2xl py-6">
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Corrida do Bambu Gastro Bar</h1>
      <p className="mt-1 text-zinc-600">
        {corridaBambu.dateLabel}, {corridaBambu.hora} · página: caicara.store/bambu
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-caicara-yellow p-4">
          <p className="font-heading text-5xl font-black leading-none">{inscritos.length}</p>
          <p className="mt-1 text-sm font-bold">inscritos</p>
        </div>
        <div className="rounded-3xl bg-zinc-900 p-4 text-white">
          <p className="font-heading text-5xl font-black leading-none">{totalPagas}</p>
          <p className="mt-1 text-sm font-bold">camisetas pagas</p>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-3xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-2">Tamanho</th>
              <th className="px-4 py-2 text-right">Pagas</th>
              <th className="px-4 py-2 text-right">Sobram</th>
              <th className="px-4 py-2 text-right">Estoque</th>
            </tr>
          </thead>
          <tbody>
            {tamanhos.map((t) => (
              <tr key={t} className="border-t border-zinc-100">
                <th className="px-4 py-2 font-bold">{t}</th>
                <td className="px-4 py-2 text-right font-bold tabular-nums">{pagas[t]}</td>
                <td className="px-4 py-2 text-right tabular-nums">{livres[t]}</td>
                <td className="px-4 py-2 text-right tabular-nums text-zinc-500">{corridaBambu.camiseta.estoque[t]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500">
          {aguardando ? `${aguardando} peça(s) aguardando pagamento. ` : ""}Pendente segura a peça por 2h. Pedido até {corridaBambu.camiseta.pedidoAteLabel}.
        </p>
      </div>

      <h2 className="mt-8 font-heading text-2xl font-black uppercase">Pedidos de camiseta</h2>
      <ul className="mt-3 grid gap-2">
        {pedidos.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white p-4">
            <div>
              <p className="text-lg font-bold">{p.nome}</p>
              <p className="text-sm text-zinc-600">{formatWhatsapp(p.whatsapp)}</p>
              <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${p.pago ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                {descreverItens(p.itens)} · R$ {p.total} · {p.forma === "cartao" ? "cartão" : "Pix"} · {p.pago ? "pago" : "pendente"}
              </p>
            </div>
            <Zap whatsapp={p.whatsapp} nome={p.nome} />
          </li>
        ))}
      </ul>
      {pedidos.length === 0 ? <p className="mt-3 text-zinc-500">Nenhum pedido ainda.</p> : null}

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
