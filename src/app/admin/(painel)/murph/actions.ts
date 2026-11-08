"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import {
  atualizarInscricao,
  baterias,
  emFila,
  listInscricoes,
  normalizeWhatsapp,
  saveInscricao,
  tamanhos,
  versaoOptions,
  vinculoOptions,
  type Bateria,
  type Tamanho,
  type Versao,
  type Vinculo,
} from "@/lib/murph";

async function existe(whatsapp: string) {
  return (await listInscricoes()).some((i) => i.whatsapp === whatsapp);
}

export async function marcarPresenteAction(whatsapp: string, presente: boolean): Promise<void> {
  await exigirAdmin();
  if (await existe(whatsapp)) await emFila(() => atualizarInscricao(whatsapp, { presente }));
  revalidatePath("/admin/murph");
}

export async function marcarPagoAction(whatsapp: string, pago: boolean): Promise<void> {
  await exigirAdmin();
  if (await existe(whatsapp)) await emFila(() => atualizarInscricao(whatsapp, { pago }));
  revalidatePath("/admin/murph");
}

/** Inscrição feita no balcão. Não trava em bateria cheia: quem decide é o Gabriel. */
export async function adicionarAction(form: FormData): Promise<void> {
  await exigirAdmin();
  const nome = String(form.get("nome") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const whatsapp = normalizeWhatsapp(String(form.get("whatsapp") ?? ""));
  const vinculo = String(form.get("vinculo") ?? "") as Vinculo;
  const bateria = String(form.get("bateria") ?? "") as Bateria;
  const versao = String(form.get("versao") ?? "") as Versao;
  if (
    nome.length < 2 ||
    !whatsapp ||
    !(vinculo in vinculoOptions) ||
    !baterias.includes(bateria) ||
    !(versao in versaoOptions)
  ) {
    redirect("/admin/murph?erro=1");
  }

  // Um campo só: "não quer" ou o tamanho. Não dá para marcar camiseta sem tamanho.
  const tamanho = String(form.get("tamanho") ?? "") as Tamanho;
  const camiseta = tamanhos.includes(tamanho);
  await emFila(async () => {
    await saveInscricao({
      nome,
      whatsapp,
      vinculo,
      bateria,
      versao,
      camiseta,
      ...(camiseta ? { tamanho } : {}),
      criadoEm: new Date().toISOString(),
    });
    const extras = { presente: form.get("presente") === "on", pago: form.get("pago") === "on" };
    if (extras.presente || extras.pago) await atualizarInscricao(whatsapp, extras);
  });
  revalidatePath("/admin/murph");
  redirect(`/admin/murph?ok=1&b=${encodeURIComponent(bateria)}`);
}
