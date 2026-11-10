import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

// Pendências do dono. "Atrasada" e "hoje" são sempre calculados na hora, nunca gravados.

export type Pendencia = {
  id: string;
  texto: string;
  /** AAAA-MM-DD. Sem prazo = "Sem data". */
  prazo?: string;
  /** AAAA-MM-DD em São Paulo. Presente = feita. */
  feitaEm?: string;
  criadaEm: string;
};

const FUSO = "America/Sao_Paulo";
const DIAS_AVISO = 3;
const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Data de hoje em São Paulo, AAAA-MM-DD (en-CA formata nessa ordem). */
export function hojeSP(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(agora);
}

function utc(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

export function somarDias(iso: string, dias: number): string {
  const data = utc(iso);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

/** "10/11 · ter" */
export function rotuloData(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m} · ${SEMANA[utc(iso).getUTCDay()]}`;
}

export function limparTexto(valor: unknown): string {
  return String(valor ?? "").trim().replace(/\s+/g, " ").slice(0, 300);
}

/** Devolve a data válida, "" se veio vazia, null se veio inválida (31/02 etc.). */
export function limparPrazo(valor: unknown): string | null {
  const texto = String(valor ?? "").trim();
  if (!texto) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  return utc(texto).toISOString().slice(0, 10) === texto ? texto : null;
}

export function agrupar(itens: Pendencia[], hoje: string) {
  const abertas = itens
    .filter((p) => !p.feitaEm)
    .sort((a, b) => (a.prazo ?? "").localeCompare(b.prazo ?? "") || a.criadaEm.localeCompare(b.criadaEm));
  return {
    atrasadas: abertas.filter((p) => p.prazo && p.prazo < hoje),
    paraHoje: abertas.filter((p) => p.prazo === hoje),
    proximas: abertas.filter((p) => p.prazo && p.prazo > hoje),
    semData: abertas.filter((p) => !p.prazo),
    feitas: itens
      .filter((p) => p.feitaEm)
      .sort((a, b) => b.feitaEm!.localeCompare(a.feitaEm!) || b.criadaEm.localeCompare(a.criadaEm)),
  };
}

/** Texto da mensagem diária. null = nada para avisar (não manda). */
export function montarAviso(itens: Pendencia[], hoje: string, link: string): string | null {
  const { atrasadas, paraHoje, proximas } = agrupar(itens, hoje);
  const limite = somarDias(hoje, DIAS_AVISO);
  const logo = proximas.filter((p) => p.prazo! <= limite);
  if (!atrasadas.length && !paraHoje.length && !logo.length) return null;

  const bloco = (titulo: string, lista: Pendencia[], comData: boolean) =>
    lista.length
      ? [`${titulo} (${lista.length})`, ...lista.map((p) => `• ${comData ? `${p.prazo!.slice(8)}/${p.prazo!.slice(5, 7)} ` : ""}${p.texto}`), ""]
      : [];

  return [
    `📋 Pendências de ${rotuloData(hoje).split(" · ").reverse().join(", ")}`,
    "",
    ...bloco("🔴 Atrasadas", atrasadas, true),
    ...bloco("🟡 Hoje", paraHoje, false),
    ...bloco(`🔵 Próximos ${DIAS_AVISO} dias`, logo, true),
    link,
  ].join("\n");
}

/** Chave da rotina e das sessões do Claude. Sem PENDENCIAS_KEY configurada, ninguém entra. */
export function chaveValida(recebida: string | null): boolean {
  const certa = process.env.PENDENCIAS_KEY ?? "";
  if (!certa || !recebida) return false;
  const hash = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(hash(recebida), hash(certa));
}

// ---- Arquivo no volume ----

const arquivo = () => path.join(process.env.DATA_DIR ?? path.join(process.cwd(), "data"), "pendencias.json");

// Toda alteração lê, muda e regrava: em fila para dois toques seguidos não perderem um ao outro.
let fila: Promise<unknown> = Promise.resolve();
function emFila<T>(fn: () => Promise<T>): Promise<T> {
  const proximo = fila.then(fn, fn);
  fila = proximo.catch(() => undefined);
  return proximo;
}

export async function listarPendencias(): Promise<Pendencia[]> {
  let bruto: string;
  try {
    bruto = await fs.readFile(arquivo(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  // JSON quebrado lança de propósito: tratar como vazio apagaria tudo na próxima gravação.
  return JSON.parse(bruto) as Pendencia[];
}

async function gravar(itens: Pendencia[]): Promise<void> {
  const destino = arquivo();
  await fs.mkdir(path.dirname(destino), { recursive: true });
  const temporario = `${destino}.${randomUUID()}.tmp`;
  await fs.writeFile(temporario, JSON.stringify(itens, null, 1));
  await fs.rename(temporario, destino);
}

function alterar<T>(fn: (itens: Pendencia[]) => T): Promise<T> {
  return emFila(async () => {
    const itens = await listarPendencias();
    const resultado = fn(itens);
    await gravar(itens);
    return resultado;
  });
}

/** Com `semRepetir`, devolve a aberta de mesmo texto em vez de criar outra (rotina pode reenviar). */
export function adicionarPendencia(
  texto: string,
  prazo: string,
  opcoes: { semRepetir?: boolean } = {},
): Promise<Pendencia> {
  return alterar((itens) => {
    const igual = opcoes.semRepetir
      ? itens.find((p) => !p.feitaEm && p.texto.toLowerCase() === texto.toLowerCase())
      : undefined;
    if (igual) return igual;
    const nova: Pendencia = {
      id: randomUUID().slice(0, 8),
      texto,
      ...(prazo ? { prazo } : {}),
      criadaEm: new Date().toISOString(),
    };
    itens.push(nova);
    return nova;
  });
}

export function marcarPendencia(id: string, feita: boolean): Promise<void> {
  return alterar((itens) => {
    const item = itens.find((p) => p.id === id);
    if (!item) return;
    if (feita) item.feitaEm = hojeSP();
    else delete item.feitaEm;
  });
}

export function editarPendencia(id: string, texto: string, prazo: string): Promise<void> {
  return alterar((itens) => {
    const item = itens.find((p) => p.id === id);
    if (!item) return;
    item.texto = texto;
    if (prazo) item.prazo = prazo;
    else delete item.prazo;
  });
}

export function apagarPendencia(id: string): Promise<void> {
  return alterar((itens) => {
    const posicao = itens.findIndex((p) => p.id === id);
    if (posicao >= 0) itens.splice(posicao, 1);
  });
}
