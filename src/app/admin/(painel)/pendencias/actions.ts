"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import {
  adicionarPendencia,
  apagarPendencia,
  editarPendencia,
  limparPrazo,
  limparTexto,
  marcarPendencia,
} from "@/lib/pendencias";

const ROTA = "/admin/pendencias";

function dados(form: FormData) {
  const texto = limparTexto(form.get("texto"));
  const prazo = limparPrazo(form.get("prazo"));
  if (texto.length < 2 || prazo === null) redirect(`${ROTA}?erro=1`);
  return { texto, prazo };
}

export async function adicionarAction(form: FormData): Promise<void> {
  await exigirAdmin();
  const { texto, prazo } = dados(form);
  await adicionarPendencia(texto, prazo);
  revalidatePath(ROTA);
}

/** Depois de marcar feita, a página mostra o "Desfazer" (um toque) pelo ?feito=. */
export async function marcarAction(id: string, feita: boolean): Promise<void> {
  await exigirAdmin();
  await marcarPendencia(id, feita);
  revalidatePath(ROTA);
  redirect(feita ? `${ROTA}?feito=${encodeURIComponent(id)}` : ROTA);
}

export async function editarAction(id: string, form: FormData): Promise<void> {
  await exigirAdmin();
  const { texto, prazo } = dados(form);
  await editarPendencia(id, texto, prazo);
  revalidatePath(ROTA);
  redirect(ROTA);
}

export async function apagarAction(id: string): Promise<void> {
  await exigirAdmin();
  await apagarPendencia(id);
  revalidatePath(ROTA);
  redirect(ROTA);
}
