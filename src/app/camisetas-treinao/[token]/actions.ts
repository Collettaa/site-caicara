"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { marcarEntregueBambu } from "@/lib/corrida-bambu";
import { getDb } from "@/lib/loja/db";
import { marcarEntregue } from "@/lib/loja/pedidos";
import { tokenTreinaoValido, vendasDaLoja } from "@/lib/treinao-camisetas";

/**
 * Dá baixa (retirou a camiseta). Só pedido pago da camiseta do treinão: o link não mexe em mais nada.
 * Pago sem peça fica com o Gabriel (troca de tamanho).
 */
export async function entregarTreinao(token: string, chave: string): Promise<void> {
  if (!tokenTreinaoValido(token, new Date())) redirect("/");
  let msg = "entregue";
  try {
    const [origem, id] = [chave.slice(0, chave.indexOf(":")), chave.slice(chave.indexOf(":") + 1)];
    if (origem === "loja") {
      const db = getDb();
      const venda = vendasDaLoja(db).find((v) => v.chave === chave);
      if (venda?.situacao !== "entregar") msg = "erro";
      else marcarEntregue(db, Number(id), new Date());
    } else if (origem === "bambu") {
      if (!(await marcarEntregueBambu(id, new Date()))) msg = "erro";
    } else msg = "erro";
  } catch (e) {
    console.error("[camisetas-treinao]", chave, e instanceof Error ? e.message.slice(0, 300) : e);
    msg = "erro";
  }
  revalidatePath("/admin", "layout");
  redirect(`/camisetas-treinao/${token}?msg=${msg}`);
}
