import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { enviarWhatsapp } from "@/lib/whatsapp";

export { normalizeWhatsapp } from "@/lib/contato";

// Passe do Treinão (Gabriel, 27/11/2026): cartão com QR entregue no Treinão do Bambu.
// 1 semana grátis com a 1ª aula marcada na hora. Começar até 07/12.
// Quem fizer a semana recebe no WhatsApp a condição de Black Friday estendida até 07/12 (preço nunca na página).
export const passeTreinao = {
  title: "Passe do Treinão",
  comecarAte: "2026-12-07", // último dia para a 1ª aula, horário de São Paulo
  comecarAteLabel: "07/12",
  origem: "treinao-bambu",
  endereco: "Av. Embaixador Pedro de Toledo, 593 · Centro, São Vicente",
  mapa: "https://www.google.com/maps/search/?api=1&query=Av.+Embaixador+Pedro+de+Toledo+593+S%C3%A3o+Vicente+SP",
  // Dias sem aula normal: 04/12 é o Murph (baterias o dia todo).
  semAula: ["2026-12-04"],
};

// Grade de Cross (Context/organization.md, confirmada em 16/09/2026). 7h e 9h são as turmas mais tranquilas.
const GRADE: Record<number, string[]> = {
  0: ["9h"], // domingo
  1: ["6h", "8h", "9h", "12h", "16h15", "18h30", "19h30"],
  2: ["6h", "7h", "9h", "12h", "16h15", "20h30"],
  3: ["6h", "8h", "9h", "12h", "16h15", "18h30", "19h30"],
  4: ["6h", "7h", "9h", "12h", "16h15", "20h30"],
  5: ["6h", "8h", "9h", "12h", "16h15", "18h30", "19h30"],
  6: ["10h"], // sábado
};
export const TRANQUILAS = new Set(["7h", "9h"]);

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export interface DiaAula {
  data: string; // AAAA-MM-DD
  rotulo: string; // "sáb 28/11"
  horarios: string[];
}

const diaSP = (agora: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);

/** Dias que dá para marcar: de amanhã até `comecarAte`, com os horários da grade. */
export function diasDisponiveis(agora: Date): DiaAula[] {
  const hoje = diaSP(agora);
  const fim = passeTreinao.comecarAte;
  const out: DiaAula[] = [];
  const d = new Date(`${hoje}T12:00:00Z`);
  for (d.setUTCDate(d.getUTCDate() + 1); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const data = d.toISOString().slice(0, 10);
    if (data > fim) break;
    if (passeTreinao.semAula.includes(data)) continue;
    const semana = d.getUTCDay();
    const [, mes, dia] = data.split("-");
    out.push({ data, rotulo: `${DIAS[semana]} ${dia}/${mes}`, horarios: GRADE[semana] });
  }
  return out;
}

export function horarioValido(data: unknown, hora: unknown, agora: Date): boolean {
  if (typeof data !== "string" || typeof hora !== "string") return false;
  return diasDisponiveis(agora).some((d) => d.data === data && d.horarios.includes(hora));
}

export type PasseInscricao = {
  nome: string;
  whatsapp: string;
  data: string;
  hora: string;
  origem: string;
  criadoEm: string;
};

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const arquivo = path.join(dataDir, "passe-treinao.jsonl");

export async function salvarPasse(p: PasseInscricao) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(arquivo, `${JSON.stringify(p)}\n`, "utf8");
}

/** Mesma pessoa marcando de novo: vale a última marcação. */
export function juntarPasses(raw: string): PasseInscricao[] {
  const porNumero = new Map<string, PasseInscricao>();
  for (const linha of raw.split("\n")) {
    if (!linha.trim()) continue;
    try {
      const p = JSON.parse(linha) as PasseInscricao;
      porNumero.delete(p.whatsapp);
      porNumero.set(p.whatsapp, p);
    } catch {
      // linha corrompida não derruba a lista
    }
  }
  return [...porNumero.values()];
}

export async function listarPasses(): Promise<PasseInscricao[]> {
  try {
    return juntarPasses(await readFile(arquivo, "utf8"));
  } catch {
    return [];
  }
}

export function rotuloDia(data: string): string {
  const d = new Date(`${data}T12:00:00Z`);
  const [, mes, dia] = data.split("-");
  return `${DIAS[d.getUTCDay()]} ${dia}/${mes}`;
}

// Aviso só no WhatsApp do Gabriel.
export async function avisarGabriel(p: PasseInscricao, total: number) {
  const { AVISO_WHATSAPP } = process.env;
  if (!AVISO_WHATSAPP) return;
  await enviarWhatsapp(
    AVISO_WHATSAPP,
    [`🎟️ Passe do Treinão: aula marcada`, p.nome, `${rotuloDia(p.data)} às ${p.hora}`, `wa.me/${p.whatsapp}`, `Total: ${total}`].join("\n"),
  );
}
