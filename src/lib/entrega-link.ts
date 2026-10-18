import { createHmac, timingSafeEqual } from "node:crypto";

// Link provisório de entrega (sem senha): vale só no dia em que foi gerado (horário de São Paulo).
// O token é um HMAC do dia com ADMIN_COOKIE_SECRET: muda sozinho à meia-noite.

export function diaSaoPaulo(agora: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

export function tokenEntrega(dia: string): string {
  const chave = process.env.ADMIN_COOKIE_SECRET ?? "";
  if (!chave) throw new Error("ADMIN_COOKIE_SECRET não configurado");
  return createHmac("sha256", chave).update(`entrega:${dia}`).digest("hex").slice(0, 24);
}

export function tokenEntregaValido(token: unknown, agora: Date): boolean {
  if (typeof token !== "string" || !/^[0-9a-f]{24}$/.test(token) || !process.env.ADMIN_COOKIE_SECRET) return false;
  const esperado = Buffer.from(tokenEntrega(diaSaoPaulo(agora)));
  const recebido = Buffer.from(token);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}
