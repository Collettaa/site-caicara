import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { enviarWhatsapp } from "@/lib/whatsapp";

export { formatWhatsapp, normalizeWhatsapp } from "@/lib/contato";

// Corrida leve e grátis na inauguração do Bambu Gastro Bar (Gabriel, 16/11/2026).
export const corridaBambu = {
  title: "Corrida de inauguração do Bambu Gastro Bar",
  date: "2026-11-27",
  dateLabel: "Sexta, 27/11",
  hora: "20h",
  // null = a página não mostra a linha.
  local: "Itararé, São Vicente" as string | null, // endereço exato da unidade nova: Gabriel manda
  percurso: null as string | null,
  inscricoesAbertas: true,
};

export type InscricaoBambu = { nome: string; whatsapp: string; criadoEm: string };

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "corrida-bambu.jsonl");

// Uma escrita por vez.
let fila: Promise<unknown> = Promise.resolve();
export function emFila<T>(fn: () => Promise<T>): Promise<T> {
  const proximo = fila.then(fn, fn);
  fila = proximo.catch(() => undefined);
  return proximo;
}

export async function saveInscricao(inscricao: InscricaoBambu) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(dataFile, `${JSON.stringify(inscricao)}\n`, "utf8");
}

/** Mesmo WhatsApp duas vezes vale a última inscrição. */
export function juntarInscricoes(raw: string): InscricaoBambu[] {
  const porNumero = new Map<string, InscricaoBambu>();
  for (const linha of raw.split("\n")) {
    if (!linha.trim()) continue;
    try {
      const item = JSON.parse(linha) as InscricaoBambu;
      porNumero.delete(item.whatsapp);
      porNumero.set(item.whatsapp, item);
    } catch {
      // linha corrompida não derruba a lista
    }
  }
  return [...porNumero.values()];
}

export async function listInscricoes(): Promise<InscricaoBambu[]> {
  try {
    return juntarInscricoes(await readFile(dataFile, "utf8"));
  } catch {
    return [];
  }
}

// Aviso só no WhatsApp do Gabriel. Nada vai para o inscrito.
export async function notifyInscricao(inscricao: InscricaoBambu, total: number) {
  const { AVISO_WHATSAPP } = process.env;
  if (!AVISO_WHATSAPP) return;
  await enviarWhatsapp(
    AVISO_WHATSAPP,
    [`🏃 Nova inscrição na corrida do Bambu Gastro Bar`, inscricao.nome, `wa.me/${inscricao.whatsapp}`, `Total: ${total}`].join("\n"),
  );
}
