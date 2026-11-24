"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import {
  FORMAS,
  type Forma,
  GRUPOS,
  type Grupo,
  dataValida,
  desfazerPagamento,
  encerrarConta,
  pagarConta,
  salvarConta,
  textoLimpo,
  valorValido,
} from "@/lib/caixa";

const ROTA = "/admin/contas";
const mesOk = (v: unknown) => (/^\d{4}-(0[1-9]|1[0-2])$/.test(String(v)) ? String(v) : null);

export async function salvarContaAction(id: string | null, form: FormData): Promise<void> {
  await exigirAdmin();
  const mes = mesOk(form.get("mes"));
  const nome = textoLimpo(form.get("nome"), 80);
  const valor = valorValido(form.get("valor"));
  const dia = Math.trunc(Number(form.get("dia")));
  const grupo = (GRUPOS as string[]).includes(String(form.get("grupo"))) ? (form.get("grupo") as Grupo) : "equipe";
  if (!mes || nome.length < 2 || !valor || !(dia >= 1 && dia <= 31)) redirect(`${ROTA}?mes=${mes ?? ""}&erro=conta`);
  const unica = form.get("unica") === "1";
  const desde = id ? mesOk(form.get("desde")) ?? mes : mes;
  await salvarConta(id, { nome, valor, dia, grupo, desde, unica: unica || undefined, obs: textoLimpo(form.get("obs")) || undefined });
  revalidatePath(ROTA);
  redirect(`${ROTA}?mes=${mes}&ok=salva`);
}

export async function pagarContaAction(contaId: string, mes: string, form: FormData): Promise<void> {
  await exigirAdmin();
  const data = dataValida(form.get("data"));
  const valor = valorValido(form.get("valor"));
  const forma = (FORMAS as string[]).includes(String(form.get("forma"))) ? (form.get("forma") as Forma) : "pix";
  if (!data || !valor) redirect(`${ROTA}?mes=${mes}&erro=pagar`);
  await pagarConta(contaId, mes, data, valor, forma);
  revalidatePath(ROTA);
  revalidatePath("/admin/caixa");
  redirect(`${ROTA}?mes=${mes}&pago=${contaId}`);
}

export async function desfazerPagamentoAction(contaId: string, mes: string): Promise<void> {
  await exigirAdmin();
  await desfazerPagamento(contaId, mes);
  revalidatePath(ROTA);
  revalidatePath("/admin/caixa");
  redirect(`${ROTA}?mes=${mes}`);
}

export async function encerrarContaAction(contaId: string, mes: string): Promise<void> {
  await exigirAdmin();
  await encerrarConta(contaId, mes);
  revalidatePath(ROTA);
  redirect(`${ROTA}?mes=${mes}&ok=encerrada`);
}
