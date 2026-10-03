import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export const aulaoRosa = {
  title: "Aulão Rosa",
  dateLabel: "Domingo, 18/10, às 9h",
  teacher: "prof. Maria",
  location: "Caiçara Fit · Av. Embaixador Pedro de Toledo, 593, São Vicente",
};

export const vinculoOptions = {
  aluno: "Aluno Caiçara",
  totalpass: "TotalPass",
  avulsa: "Avulsa (paga na hora)",
} as const;

export type Vinculo = keyof typeof vinculoOptions;

export type Inscricao = {
  nome: string;
  whatsapp: string;
  vinculo: Vinculo;
  criadoEm: string;
};

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "aulao-rosa.jsonl");

export function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits;
  return null;
}

export function formatWhatsapp(digits: string) {
  const local = digits.slice(2);
  const ddd = local.slice(0, 2);
  const rest = local.slice(2);
  return `(${ddd}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
}

export async function saveInscricao(inscricao: Inscricao) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(dataFile, `${JSON.stringify(inscricao)}\n`, "utf8");
}

// Mesma pessoa inscrita duas vezes vale a última inscrição.
export async function listInscricoes(): Promise<Inscricao[]> {
  let raw = "";
  try {
    raw = await readFile(dataFile, "utf8");
  } catch {
    return [];
  }

  const byPhone = new Map<string, Inscricao>();
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line) as Inscricao;
      byPhone.delete(item.whatsapp);
      byPhone.set(item.whatsapp, item);
    } catch {
      // linha corrompida não derruba a lista
    }
  }
  return [...byPhone.values()];
}

// Aviso no WhatsApp do dono pela Evolution API. Falha aqui não perde a inscrição.
export async function notifyInscricao(inscricao: Inscricao, total: number) {
  const { EVOLUTION_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, AVISO_WHATSAPP } = process.env;
  if (!EVOLUTION_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE || !AVISO_WHATSAPP) return;

  const text = [
    `🎀 Nova inscrição no ${aulaoRosa.title}`,
    `${inscricao.nome}`,
    `${vinculoOptions[inscricao.vinculo]}`,
    `wa.me/${inscricao.whatsapp}`,
    `Total: ${total}`,
  ].join("\n");

  try {
    await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: AVISO_WHATSAPP, text }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error("aulao-rosa: aviso no WhatsApp falhou", error);
  }
}
