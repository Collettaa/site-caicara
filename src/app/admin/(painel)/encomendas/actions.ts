"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import {
  FORMAS,
  type Forma,
  type StatusEncomenda,
  apagarEncomenda,
  dataValida,
  desfazerPagoEncomenda,
  mudarStatusEncomenda,
  pagarEncomenda,
  salvarEncomenda,
  textoLimpo,
  valorValido,
} from "@/lib/caixa";

const ROTA = "/admin/encomendas";
const atualizar = () => {
  revalidatePath(ROTA);
  revalidatePath("/admin/caixa");
};

export async function salvarEncomendaAction(id: string | null, form: FormData): Promise<void> {
  await exigirAdmin();
  const cliente = textoLimpo(form.get("cliente"), 80);
  const item = textoLimpo(form.get("item"), 120);
  const qtd = Math.max(1, Math.min(99, Math.trunc(Number(form.get("qtd")) || 1)));
  const valor = valorValido(form.get("valor"));
  if (cliente.length < 2 || item.length < 2 || !valor) redirect(`${ROTA}?erro=1`);
  const e = await salvarEncomenda(id, { cliente, item, qtd, valor, obs: textoLimpo(form.get("obs")) || undefined });
  atualizar();
  redirect(`${ROTA}?ok=1#e-${e.id}`);
}

export async function statusEncomendaAction(id: string, status: StatusEncomenda): Promise<void> {
  await exigirAdmin();
  await mudarStatusEncomenda(id, status);
  atualizar();
  redirect(`${ROTA}#e-${id}`);
}

export async function pagarEncomendaAction(id: string, form: FormData): Promise<void> {
  await exigirAdmin();
  const data = dataValida(form.get("data"));
  const f = String(form.get("forma"));
  const forma: Forma | "asaas" = f === "asaas" ? "asaas" : (FORMAS as string[]).includes(f) ? (f as Forma) : "pix";
  if (!data) redirect(`${ROTA}?erro=1`);
  await pagarEncomenda(id, data, forma);
  atualizar();
  redirect(`${ROTA}#e-${id}`);
}

export async function desfazerPagoAction(id: string): Promise<void> {
  await exigirAdmin();
  await desfazerPagoEncomenda(id);
  atualizar();
  redirect(`${ROTA}#e-${id}`);
}

export async function apagarEncomendaAction(id: string): Promise<void> {
  await exigirAdmin();
  await apagarEncomenda(id);
  atualizar();
  redirect(ROTA);
}
