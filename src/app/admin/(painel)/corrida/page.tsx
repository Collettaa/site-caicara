import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { exigirAdmin } from "@/lib/admin-auth";
import { conferirPix, contarCamisetas, corridaBambu, formatWhatsapp, listInscricoes, tamanhos } from "@/lib/corrida-bambu";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Corrida" };

export default async function CorridaAdminPage() {
  await exigirAdmin();
  // Ao abrir, confere no Asaas quem ainda está com o Pix da camiseta pendente.
  const pendentes = (await listInscricoes()).filter((i) => i.pagamentoId && !i.pixPago);
  await Promise.all(pendentes.map((i) => conferirPix(i).catch(() => false)));
  const inscritos = (await listInscricoes()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const { pagas, aguardando } = contarCamisetas(inscritos);
  const totalPagas = tamanhos.reduce((n, t) => n + pagas[t], 0);

  return (
    <div className="container max-w-2xl py-6">
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Corrida do Bambu Gastro Bar</h1>
      <p className="mt-1 text-zinc-600">
        {corridaBambu.dateLabel}, {corridaBambu.hora} · página: caicara.store/bambu
      </p>
      <div className="mt-4 rounded-3xl bg-caicara-yellow p-4">
        <p className="font-heading text-5xl font-black leading-none">{inscritos.length}</p>
        <p className="mt-1 text-sm font-bold">inscritos</p>
      </div>
      <div className="mt-3 rounded-3xl border border-zinc-200 bg-white p-4">
        <p className="font-bold">
          Camisetas pagas: {totalPagas}
          {aguardando ? <span className="font-normal text-zinc-600"> · {aguardando} aguardando pagamento</span> : null}
        </p>
        <p className="mt-1 text-sm text-zinc-600">{tamanhos.map((t) => `${t}: ${pagas[t]}`).join(" · ")} · pedido até {corridaBambu.camiseta.pedidoAteLabel}</p>
      </div>
      <ul className="mt-4 grid gap-2">
        {inscritos.map((i) => (
          <li key={i.whatsapp} className="flex items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white p-4">
            <div>
              <p className="text-lg font-bold">{i.nome}</p>
              <p className="text-sm text-zinc-600">{formatWhatsapp(i.whatsapp)}</p>
              {i.camiseta ? (
                <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${i.pixPago ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                  Camiseta {i.camiseta} · {i.forma === "cartao" ? "cartão" : "Pix"} · {i.pixPago ? "paga" : "pendente"}
                </p>
              ) : null}
            </div>
            <a
              href={`https://wa.me/${i.whatsapp}`}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-black"
              aria-label={`WhatsApp de ${i.nome}`}
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </li>
        ))}
      </ul>
      {inscritos.length === 0 ? <p className="mt-6 text-center text-zinc-500">Ninguém inscrito ainda.</p> : null}
    </div>
  );
}
