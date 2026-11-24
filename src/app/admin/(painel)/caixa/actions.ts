"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import { FORMAS, type Forma, apagarLancamento, dataValida, lancar, textoLimpo, valorValido } from "@/lib/caixa";

const ROTA = "/admin/caixa";

export async function lancarAction(form: FormData): Promise<void> {
  await exigirAdmin();
  const data = dataValida(form.get("data"));
  const valor = valorValido(form.get("valor"));
  const tipo = form.get("tipo") === "saida" ? "saida" : "entrada";
  const forma = (FORMAS as string[]).includes(String(form.get("forma"))) ? (form.get("forma") as Forma) : "dinheiro";
  const descricao = textoLimpo(form.get("descricao")) || (tipo === "entrada" ? "Entrada" : "Saída");
  if (!data || !valor) redirect(`${ROTA}?erro=1`);
  await lancar({ data, valor, tipo, forma, descricao });
  revalidatePath(ROTA);
  redirect(`${ROTA}?mes=${data.slice(0, 7)}&ok=${tipo}&dia=${data}#d-${data}`);
}

export async function apagarLancamentoAction(id: string, mes: string): Promise<void> {
  await exigirAdmin();
  await apagarLancamento(id);
  revalidatePath(ROTA);
  redirect(`${ROTA}?mes=${mes}`);
}
