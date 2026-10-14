import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const COOKIE_ADMIN = "caicara_admin";
export const SESSAO_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ERROS = 5;
const TRAVA_MS = 15 * 60 * 1000;

function segredo(): string {
  return process.env.ADMIN_COOKIE_SECRET ?? "";
}

function hmac(dado: string, chave: string): string {
  return createHmac("sha256", chave).update(dado).digest("hex");
}

/** Valor do cookie: "<expiraEmMs>.<hmac>". */
export function assinarSessao(agora: Date): string {
  const chave = segredo();
  if (!chave) throw new Error("ADMIN_COOKIE_SECRET não configurado");
  const expira = String(agora.getTime() + SESSAO_MS);
  return `${expira}.${hmac(expira, chave)}`;
}

export function sessaoValida(valor: string | undefined, agora: Date): boolean {
  const chave = segredo();
  if (!chave || !valor) return false;
  const ponto = valor.indexOf(".");
  if (ponto <= 0) return false;
  const expira = valor.slice(0, ponto);
  const assinatura = valor.slice(ponto + 1);
  if (!/^\d+$/.test(expira)) return false;
  const esperado = Buffer.from(hmac(expira, chave));
  const recebido = Buffer.from(assinatura);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return false;
  return Number(expira) > agora.getTime();
}

type Tentativas = { erros: number; travadoAte: number };
const tentativas = new Map<string, Tentativas>();

function sha256(texto: string): Buffer {
  return createHash("sha256").update(texto).digest();
}

export function conferirSenha(senha: string, ip: string, agora: Date): "ok" | "errada" | "travado" {
  const t = agora.getTime();
  for (const [chave, reg] of tentativas) {
    if (reg.travadoAte && reg.travadoAte <= t) tentativas.delete(chave);
  }
  const reg = tentativas.get(ip) ?? { erros: 0, travadoAte: 0 };
  if (reg.travadoAte > t) return "travado";

  const certa = process.env.ADMIN_SENHA ?? "";
  // Sem senha ou sem segredo configurados, ninguém entra.
  const ok = Boolean(certa) && Boolean(segredo()) && timingSafeEqual(sha256(senha), sha256(certa));
  if (ok) {
    tentativas.delete(ip);
    return "ok";
  }
  reg.erros += 1;
  if (reg.erros >= MAX_ERROS) {
    reg.erros = 0;
    reg.travadoAte = t + TRAVA_MS;
  }
  tentativas.set(ip, reg);
  return "errada";
}

/** Barra quem não tem sessão. Chamar no layout do painel e no início de toda action/rota de admin. */
export async function exigirAdmin(): Promise<void> {
  const valor = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!sessaoValida(valor, new Date())) redirect("/admin/login");
}
