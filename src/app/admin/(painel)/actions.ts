"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import { cancelarCobranca } from "@/lib/loja/cobranca";
import { getDb } from "@/lib/loja/db";
import { reais } from "@/lib/loja/mensagens";
import { type EntradaBalcao, ErroLoja, cancelar, marcarEntregue, vendaBalcao } from "@/lib/loja/pedidos";
import { type Aba, type CodigoErro, type CodigoMsg, abaValida } from "./avisos";

type Volta = { msg: CodigoMsg } | { erro: CodigoErro } | { ajuste: number };

/** Volta para a aba com um código (o texto é escolhido na página, nunca vem da URL). */
function voltar(aba: Aba, volta: Volta): never {
  revalidatePath("/admin", "layout");
  revalidatePath("/loja", "layout");
  const qs = new URLSearchParams({ aba });
  for (const [k, v] of Object.entries(volta)) qs.set(k, String(v));
  redirect(`/admin?${qs}`);
}

const idValido = (id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id > 0;

function codigoErro(e: unknown, status: CodigoErro): CodigoErro {
  if (!(e instanceof ErroLoja)) {
    console.error("[admin]", e instanceof Error ? e.message.slice(0, 300) : e);
    return "falhou";
  }
  if (e.codigo === "nao_encontrado") return "nao_encontrado";
  if (e.codigo === "status") return status;
  return "falhou";
}

/** Cliente retirou. Pago sem peça entregue com outro tamanho → avisa para tirar a peça no −. */
export async function entregarAction(id: number): Promise<void> {
  await exigirAdmin();
  if (!idValido(id)) voltar("entregar", { erro: "invalido" });
  let ajuste = false;
  try {
    ajuste = marcarEntregue(getDb(), id, new Date()).ajusteManual;
  } catch (e) {
    voltar("entregar", { erro: codigoErro(e, "nao_pago") });
  }
  voltar("entregar", ajuste ? { ajuste: id } : { msg: "entregue" });
}

/**
 * Cancela e devolve a peça ao estoque. Entregue não cancela. Aguardando com cobrança: cancela a
 * cobrança no Asaas também. Já pago: lembra do estorno no Asaas.
 */
export async function cancelarAction(id: number, abaRecebida: string): Promise<void> {
  await exigirAdmin();
  const aba = abaValida(abaRecebida);
  if (!idValido(id)) voltar(aba, { erro: "invalido" });
  let msg: CodigoMsg = "cancelado";
  try {
    const db = getDb();
    const antes = db.prepare("SELECT status FROM pedidos WHERE id = ?").get(id) as { status?: string } | undefined;
    const pedido = cancelar(db, id);
    if (antes?.status === "pago" || antes?.status === "pago_sem_peca") msg = "cancelado_estornar";
    if (antes?.status === "aguardando" && pedido.asaasId) {
      try {
        await cancelarCobranca(pedido);
      } catch (e) {
        console.error("[admin] cancelar cobrança", id, e instanceof Error ? e.message.slice(0, 300) : e);
        msg = "asaas_falhou";
      }
    }
  } catch (e) {
    voltar(aba, { erro: codigoErro(e, "entregue") });
  }
  voltar(aba, { msg });
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
    // Estoque mudou (ou peça esgotou): recarrega a lista do balcão com os números de agora.
    revalidatePath("/admin/balcao");
    if (!(e instanceof ErroLoja)) console.error("[admin] balcão", e instanceof Error ? e.message.slice(0, 300) : e);
    return { erro: e instanceof ErroLoja ? e.message : "Não deu certo. Tenta de novo.", vez: Date.now() };
  }
}
