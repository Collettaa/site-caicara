"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import {
  atualizarInscricao,
  listInscricoes,
  normalizeWhatsapp,
  saveInscricao,
  vinculoOptions,
  type Vinculo,
} from "@/lib/aulao-rosa";

async function existe(whatsapp: string) {
  return (await listInscricoes()).some((i) => i.whatsapp === whatsapp);
}

export async function marcarPresenteAction(whatsapp: string, presente: boolean): Promise<void> {
  await exigirAdmin();
  if (await existe(whatsapp)) await atualizarInscricao(whatsapp, { presente });
  revalidatePath("/admin/aulao");
}

export async function marcarPagoPorForaAction(whatsapp: string, pagoPorFora: boolean): Promise<void> {
  await exigirAdmin();
  if (await existe(whatsapp)) await atualizarInscricao(whatsapp, { pagoPorFora });
  revalidatePath("/admin/aulao");
}

/** Inscrição feita no balcão (quem chegou sem se inscrever no site). */
export async function adicionarAction(form: FormData): Promise<void> {
  await exigirAdmin();
  const nome = String(form.get("nome") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const whatsapp = normalizeWhatsapp(String(form.get("whatsapp") ?? ""));
  const vinculo = String(form.get("vinculo") ?? "") as Vinculo;
  if (nome.length < 2 || !whatsapp || !(vinculo in vinculoOptions)) redirect("/admin/aulao?erro=1");

  await saveInscricao({ nome, whatsapp, vinculo, criadoEm: new Date().toISOString() });
  const extras = { presente: form.get("presente") === "on", pagoPorFora: vinculo === "avulsa" && form.get("pago") === "on" };
  if (extras.presente || extras.pagoPorFora) await atualizarInscricao(whatsapp, extras);
  revalidatePath("/admin/aulao");
  redirect("/admin/aulao?ok=1");
}
