"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import { apagarLembrete, quandoValido, salvarLembrete } from "@/lib/lembretes";

const ROTA = "/admin/automacoes";

export async function salvarLembreteAction(id: string | null, form: FormData): Promise<void> {
  await exigirAdmin();
  const quando = quandoValido(form.get("data"), form.get("hora"));
  const texto = String(form.get("texto") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 4000);
  const assunto = String(form.get("assunto") ?? "").trim().slice(0, 40) || undefined;
  if (!quando || texto.length < 2) redirect(`${ROTA}?erro=1`);
  const l = await salvarLembrete(id, { quando, texto, grupo: "alunos", assunto });
  revalidatePath(ROTA);
  redirect(`${ROTA}?ok=1#l-${l.id}`);
}

export async function apagarLembreteAction(id: string): Promise<void> {
  await exigirAdmin();
  await apagarLembrete(id);
  revalidatePath(ROTA);
  redirect(ROTA);
}
