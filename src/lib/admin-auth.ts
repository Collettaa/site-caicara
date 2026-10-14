import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const COOKIE_ADMIN = "caicara_admin";
export const SESSAO_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ERROS = 5;
const TRAVA_MS = 15 * 60 * 1000;

const MAX_ERROS_GLOBAL = 20;
const MAX_REGISTROS = 5000;

function segredo(): string {
  return process.env.ADMIN_COOKIE_SECRET ?? "";
}

function senhaConfigurada(): string {
  return process.env.ADMIN_SENHA ?? "";
}

function sha256(texto: string): Buffer {
  return createHash("sha256").update(texto).digest();
}

/** HMAC sobre a validade + hash da senha: trocar ADMIN_SENHA invalida todas as sessões. */
function hmac(expira: string, chave: string, senha: string): string {
  return createHmac("sha256", chave)
    .update(`${expira}.${sha256(senha).toString("hex")}`)
    .digest("hex");
}

/** Valor do cookie: "<expiraEmMs>.<hmac>". */
export function assinarSessao(agora: Date): string {
  const chave = segredo();
  const senha = senhaConfigurada();
  if (!chave || !senha) throw new Error("ADMIN_COOKIE_SECRET ou ADMIN_SENHA não configurado");
  const expira = String(agora.getTime() + SESSAO_MS);
  return `${expira}.${hmac(expira, chave, senha)}`;
}

export function sessaoValida(valor: string | undefined, agora: Date): boolean {
  const chave = segredo();
  const senha = senhaConfigurada();
  if (!chave || !senha || !valor) return false;
  const ponto = valor.indexOf(".");
  if (ponto <= 0) return false;
  const expira = valor.slice(0, ponto);
  const assinatura = valor.slice(ponto + 1);
  if (!/^\d+$/.test(expira)) return false;
  const esperado = Buffer.from(hmac(expira, chave, senha));
  const recebido = Buffer.from(assinatura);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return false;
  return Number(expira) > agora.getTime();
}

type Tentativas = { erros: number; primeiroErroEm: number; travadoAte: number };

// Em globalThis para sobreviver ao recarregamento de módulo no dev.
const memoria = globalThis as typeof globalThis & {
  __adminTentativas?: Map<string, Tentativas>;
  __adminErrosGlobais?: number[];
};
const tentativas = (memoria.__adminTentativas ??= new Map());

function limpar(t: number): void {
  for (const [ip, reg] of tentativas) {
    if (reg.travadoAte > t) continue;
    if (reg.travadoAte || t - reg.primeiroErroEm > TRAVA_MS) tentativas.delete(ip);
  }
  memoria.__adminErrosGlobais = (memoria.__adminErrosGlobais ?? []).filter((e) => t - e < TRAVA_MS);
}

function registrarErro(ip: string, t: number): void {
  memoria.__adminErrosGlobais!.push(t);
  let reg = tentativas.get(ip);
  if (!reg) {
    if (tentativas.size >= MAX_REGISTROS) {
      // Teto de memória: sai o registro mais antigo que não esteja travado.
      let vitima: string | undefined;
      for (const [chave, r] of tentativas) {
        if (r.travadoAte <= t) {
          vitima = chave;
          break;
        }
      }
      tentativas.delete(vitima ?? tentativas.keys().next().value!);
    }
    reg = { erros: 0, primeiroErroEm: t, travadoAte: 0 };
    tentativas.set(ip, reg);
  }
  reg.erros += 1;
  if (reg.erros >= MAX_ERROS) reg.travadoAte = t + TRAVA_MS;
}

export function conferirSenha(senha: string, ip: string, agora: Date): "ok" | "errada" | "travado" {
  const t = agora.getTime();
  limpar(t);
  if ((tentativas.get(ip)?.travadoAte ?? 0) > t) return "travado";
  // Teto global: muitos erros somando todos os IPs travam o login para todo mundo.
  if (memoria.__adminErrosGlobais!.length >= MAX_ERROS_GLOBAL) return "travado";

  const certa = senhaConfigurada();
  // Sem senha ou sem segredo configurados, ninguém entra.
  const ok = Boolean(certa) && Boolean(segredo()) && timingSafeEqual(sha256(senha), sha256(certa));
  if (ok) {
    tentativas.delete(ip);
    return "ok";
  }
  registrarErro(ip, t);
  return "errada";
}

/** Barra quem não tem sessão. Chamar no layout do painel e no início de toda action/rota de admin. */
export async function exigirAdmin(): Promise<void> {
  const valor = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!sessaoValida(valor, new Date())) redirect("/admin/login");
}
