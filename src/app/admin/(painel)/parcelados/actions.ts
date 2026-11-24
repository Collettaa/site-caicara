"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import { apagarParcelado, dataValida, desfazerParcela, pagarParcela, salvarParcelado, textoLimpo, valorValido } from "@/lib/caixa";

const ROTA = "/admin/parcelados";

export async function salvarParceladoAction(id: string | null, form: FormData): Promise<void> {
  await exigirAdmin();
  const pessoa = textoLimpo(form.get("pessoa"), 60);
  const descricao = textoLimpo(form.get("descricao"), 120);
  const total = valorValido(form.get("total"));
  const parcelas = Math.trunc(Number(form.get("parcelas")));
  const dia = Math.trunc(Number(form.get("dia")));
  const inicio = String(form.get("inicio") ?? "");
  if (pessoa.length < 2 || descricao.length < 2 || !total || !(parcelas >= 1 && parcelas <= 60) || !(dia >= 1 && dia <= 31) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(inicio)) {
    redirect(`${ROTA}?erro=1`);
  }
  const p = await salvarParcelado(id, { pessoa, descricao, total, parcelas, dia, inicio, obs: textoLimpo(form.get("obs")) || undefined });
  revalidatePath(ROTA);
  redirect(`${ROTA}?ok=salvo#p-${p.id}`);
}

export async function pagarParcelaAction(id: string, form: FormData): Promise<void> {
  await exigirAdmin();
  const data = dataValida(form.get("data"));
  const valor = valorValido(form.get("valor"));
  if (!data || !valor) redirect(`${ROTA}?erro=parcela`);
  await pagarParcela(id, data, valor);
  revalidatePath(ROTA);
  redirect(`${ROTA}?pago=${id}#p-${id}`);
}

export async function desfazerParcelaAction(id: string): Promise<void> {
  await exigirAdmin();
  await desfazerParcela(id);
  revalidatePath(ROTA);
  redirect(`${ROTA}#p-${id}`);
}

export async function apagarParceladoAction(id: string): Promise<void> {
  await exigirAdmin();
  await apagarParcelado(id);
  revalidatePath(ROTA);
  redirect(ROTA);
}
