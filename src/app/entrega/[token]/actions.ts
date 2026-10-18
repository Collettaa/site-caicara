"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { tokenEntregaValido } from "@/lib/entrega-link";
import { getDb } from "@/lib/loja/db";
import { marcarEntregue } from "@/lib/loja/pedidos";

/** Só marca entregue pedido `pago`. Pago sem peça fica com o dono (troca de tamanho). */
export async function entregarProvisorio(token: string, id: number): Promise<void> {
  if (!tokenEntregaValido(token, new Date())) redirect("/");
  let msg = "entregue";
  try {
    const db = getDb();
    const antes = db.prepare("SELECT status FROM pedidos WHERE id = ?").get(id) as { status?: string } | undefined;
    if (!Number.isInteger(id) || antes?.status !== "pago") msg = "erro";
    else marcarEntregue(db, id, new Date());
  } catch (e) {
    console.error("[entrega]", id, e instanceof Error ? e.message.slice(0, 300) : e);
    msg = "erro";
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/loja", "layout");
  redirect(`/entrega/${token}?msg=${msg}`);
}
