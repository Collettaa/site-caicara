import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { enviarWhatsapp } from "@/lib/whatsapp";

export { formatWhatsapp, normalizeWhatsapp } from "@/lib/contato";

export const murph = {
  title: "Murph",
  date: "2026-12-04",
  dateLabel: "Sexta, 04/12",
  location: "Caiçara Fit · Av. Embaixador Pedro de Toledo, 593, São Vicente",
  vagasPorBateria: 30,
  inscricoesAbertas: true,
  // Sem valor aqui = sem preço na página. Preencher só depois do ok do Gabriel.
  inscricaoForaValor: undefined as number | undefined,
  camisetaValor: undefined as number | undefined,
  whatsappFinal: "https://wa.me/5513920013547?text=MURPH",
};

export const baterias = ["06:00", "08:00", "12:00", "16:00", "18:30", "20:00"] as const;
export type Bateria = (typeof baterias)[number];

export const bateriaLabel = (b: Bateria) => b.replace(/^0/, "").replace(":00", "h").replace(":", "h");

export const versaoOptions = {
  completo: "Completo",
  dupla: "Em dupla",
  meio: "Meio Murph",
} as const;
export type Versao = keyof typeof versaoOptions;

export const vinculoOptions = {
  aluno: "Aluno Caiçara",
  totalpass: "TotalPass",
  fora: "De fora",
} as const;
export type Vinculo = keyof typeof vinculoOptions;

export type InscricaoMurph = {
  nome: string;
  whatsapp: string;
  vinculo: Vinculo;
  bateria: Bateria;
  versao: Versao;
  camiseta: boolean;
  criadoEm: string;
  pago?: boolean; // marcado no admin: acertou inscrição/camiseta
  presente?: boolean; // check-in no dia
};

type Ajuste = { ajuste: string } & Partial<Pick<InscricaoMurph, "pago" | "presente">>;

/** Quem tem algo a pagar: de fora (inscrição) ou quem pediu camiseta. Aluno e TotalPass sem camiseta não pagam. */
export const devePagar = (i: Pick<InscricaoMurph, "vinculo" | "camiseta">) => i.camiseta || i.vinculo === "fora";

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "murph.jsonl");

// Uma escrita por vez: a checagem de vaga e o append não se atropelam.
let fila: Promise<unknown> = Promise.resolve();
export function emFila<T>(fn: () => Promise<T>): Promise<T> {
  const proximo = fila.then(fn, fn);
  fila = proximo.catch(() => undefined);
  return proximo;
}

export async function saveInscricao(inscricao: InscricaoMurph) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(dataFile, `${JSON.stringify(inscricao)}\n`, "utf8");
}

export async function atualizarInscricao(whatsapp: string, campos: Omit<Ajuste, "ajuste">) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(dataFile, `${JSON.stringify({ ajuste: whatsapp, ...campos })}\n`, "utf8");
}

// Mesma pessoa inscrita duas vezes vale a última inscrição; ajustes só mudam campos.
export function juntarInscricoes(raw: string): InscricaoMurph[] {
  const byPhone = new Map<string, InscricaoMurph>();
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line) as InscricaoMurph | Ajuste;
      if ("ajuste" in item) {
        const atual = byPhone.get(item.ajuste);
        const { ajuste: _ajuste, ...campos } = item;
        if (atual) byPhone.set(item.ajuste, { ...atual, ...campos });
        continue;
      }
      const antes = byPhone.get(item.whatsapp);
      byPhone.delete(item.whatsapp);
      byPhone.set(item.whatsapp, { ...item, pago: antes?.pago, presente: antes?.presente });
    } catch {
      // linha corrompida não derruba a lista
    }
  }
  return [...byPhone.values()];
}

export async function listInscricoes(): Promise<InscricaoMurph[]> {
  try {
    return juntarInscricoes(await readFile(dataFile, "utf8"));
  } catch {
    return [];
  }
}

/** Ocupação por bateria. `ignorar` = WhatsApp de quem está trocando de bateria (não conta contra ele mesmo). */
export function ocupacao(lista: InscricaoMurph[], ignorar?: string): Record<Bateria, number> {
  const conta = Object.fromEntries(baterias.map((b) => [b, 0])) as Record<Bateria, number>;
  for (const i of lista) if (i.whatsapp !== ignorar && i.bateria in conta) conta[i.bateria]++;
  return conta;
}

export function bateriasLivres(lista: InscricaoMurph[], ignorar?: string): Bateria[] {
  const conta = ocupacao(lista, ignorar);
  return baterias.filter((b) => conta[b] < murph.vagasPorBateria);
}

// Aviso no WhatsApp do Gabriel (só ele). Nunca manda nada para o inscrito.
export async function notifyInscricao(inscricao: InscricaoMurph, naBateria: number, total: number) {
  const { AVISO_WHATSAPP } = process.env;
  if (!AVISO_WHATSAPP) return;

  const text = [
    `🏋️ Nova inscrição no Murph`,
    inscricao.nome,
    `${vinculoOptions[inscricao.vinculo]} · ${versaoOptions[inscricao.versao]}${inscricao.camiseta ? " · quer camiseta" : ""}`,
    `Bateria ${bateriaLabel(inscricao.bateria)}: ${naBateria}/${murph.vagasPorBateria}`,
    `wa.me/${inscricao.whatsapp}`,
    `Total: ${total}`,
  ].join("\n");

  await enviarWhatsapp(AVISO_WHATSAPP, text);
}
