"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import { checkinsDaPlanilha, importarCheckins, lerXlsx } from "@/lib/financeiro/totalpass";

/** Planilha de tokens da TotalPass (.xlsx). Importar de novo não duplica. */
export async function importarTotalPassAction(form: FormData): Promise<void> {
  await exigirAdmin();
  const mes = String(form.get("mes") ?? "");
  const arquivo = form.get("planilha");
  const voltar = (qs: string) => redirect(`/admin/financeiro?mes=${encodeURIComponent(mes)}&${qs}#totalpass`);
  if (!(arquivo instanceof File) || arquivo.size === 0) voltar("tp=vazio");
  let resultado: { novos: number; total: number };
  try {
    const checkins = checkinsDaPlanilha(lerXlsx(new Uint8Array(await (arquivo as File).arrayBuffer())));
    resultado = await importarCheckins(checkins);
  } catch (e) {
    console.error("[totalpass]", e instanceof Error ? e.message.slice(0, 200) : e);
    return voltar("tp=erro");
  }
  revalidatePath("/admin/financeiro");
  voltar(`tp=ok&novos=${resultado.novos}`);
}
