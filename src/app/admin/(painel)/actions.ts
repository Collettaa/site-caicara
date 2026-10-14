"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import { cancelarCobranca } from "@/lib/loja/cobranca";
import { getDb } from "@/lib/loja/db";
import { reais } from "@/lib/loja/mensagens";
import { type EntradaBalcao, ErroLoja, cancelar, marcarEntregue, vendaBalcao } from "@/lib/loja/pedidos";

type Aba = "entregar" | "aguardando" | "entregues";

function voltar(aba: Aba, extra: Record<string, string> = {}): never {
  revalidatePath("/admin", "layout");
  revalidatePath("/loja", "layout");
  const qs = new URLSearchParams({ aba, ...extra });
  redirect(`/admin?${qs}`);
}

const msgErro = (e: unknown) => (e instanceof ErroLoja ? e.message : "Não deu certo. Tenta de novo.");

/** Cliente retirou. Pago sem peça entregue com outro tamanho → avisa para tirar a peça no −. */
export async function entregarAction(id: number): Promise<void> {
  await exigirAdmin();
  let ajuste = false;
  try {
    ajuste = marcarEntregue(getDb(), id, new Date()).ajusteManual;
  } catch (e) {
    voltar("entregar", { erro: msgErro(e) });
  }
  voltar("entregar", ajuste ? { ajuste: String(id) } : { ok: "Pedido entregue." });
}

/** Cancela e devolve a peça ao estoque. Aguardando com cobrança: cancela a cobrança no Asaas também. */
export async function cancelarAction(id: number, aba: Aba): Promise<void> {
  await exigirAdmin();
  let aviso = "Pedido cancelado.";
  try {
    const db = getDb();
    const antes = db.prepare("SELECT status FROM pedidos WHERE id = ?").get(id) as { status?: string } | undefined;
    const pedido = cancelar(db, id);
    if (antes?.status === "aguardando" && pedido.asaasId) {
      try {
        await cancelarCobranca(pedido);
      } catch (e) {
        console.error("[admin] cancelar cobrança", id, e instanceof Error ? e.message.slice(0, 300) : e);
        aviso = "Pedido cancelado. A cobrança no Asaas não cancelou — apaga ela lá.";
      }
    }
  } catch (e) {
    voltar(aba, { erro: msgErro(e) });
  }
  voltar(aba, { ok: aviso });
}

export type EstadoBalcao = { ok?: string; erro?: string; vez: number } | null;

const FORMAS = new Set<EntradaBalcao["forma"]>(["balcao_dinheiro", "balcao_pix", "balcao_cartao"]);

/** Venda no balcão: campos `qtd_<variacaoId>`, `forma` e `nome` (opcional). */
export async function balcaoAction(formData: FormData): Promise<EstadoBalcao> {
  await exigirAdmin();
  const forma = String(formData.get("forma") ?? "") as EntradaBalcao["forma"];
  if (!FORMAS.has(forma)) return { erro: "Escolhe a forma de pagamento.", vez: Date.now() };

  const itens: EntradaBalcao["itens"] = [];
  for (const [chave, v] of formData.entries()) {
    const m = /^qtd_(\d+)$/.exec(chave);
    const qtd = Number(v);
    if (m && Number.isInteger(qtd) && qtd > 0) itens.push({ variacaoId: Number(m[1]), qtd });
  }
  if (itens.length === 0) return { erro: "Escolhe pelo menos uma peça.", vez: Date.now() };

  const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);
  try {
    const pedido = vendaBalcao(getDb(), { itens, forma, nome: nome || undefined }, new Date());
    revalidatePath("/admin", "layout");
    revalidatePath("/loja", "layout");
    const pecas = pedido.itens.reduce((s, i) => s + i.qtd, 0);
    return { ok: `Venda registrada: ${pecas} ${pecas === 1 ? "peça" : "peças"} · ${reais(pedido.total)}`, vez: Date.now() };
  } catch (e) {
    return { erro: msgErro(e), vez: Date.now() };
  }
}
