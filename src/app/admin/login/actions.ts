"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ADMIN, SESSAO_MS, assinarSessao, conferirSenha } from "@/lib/admin-auth";
import { ipDoCliente } from "@/lib/ip";

export type EstadoLogin = { erro: string } | null;

async function ipDoPedido(): Promise<string> {
  return ipDoCliente(await headers());
}

export async function entrarAction(_anterior: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const senha = String(formData.get("senha") ?? "");
  const agora = new Date();
  const resultado = conferirSenha(senha, await ipDoPedido(), agora);
  if (resultado === "travado") return { erro: "Muitas tentativas. Tenta de novo em 15 minutos." };
  if (resultado === "errada") return { erro: "Senha errada." };

  (await cookies()).set(COOKIE_ADMIN, assinarSessao(agora), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSAO_MS / 1000,
  });
  redirect("/admin");
}

export async function sairAction(): Promise<void> {
  (await cookies()).set(COOKIE_ADMIN, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 0,
  });
  redirect("/admin/login");
}
