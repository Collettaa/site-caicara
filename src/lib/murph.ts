import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ASAAS_URL_PADRAO, asaasFetch } from "@/lib/asaas";
import { enviarWhatsapp } from "@/lib/whatsapp";

export { formatWhatsapp, isValidCpf, normalizeWhatsapp } from "@/lib/contato";

export const murph = {
  title: "Murph",
  date: "2026-12-04",
  dateLabel: "Sexta, 04/12",
  location: "Caiçara Fit · Av. Embaixador Pedro de Toledo, 593, São Vicente",
  vagasPorBateria: 30,
  inscricoesAbertas: true,
  // Quem é de fora paga a participação no Pix (ok do Gabriel em 11/11/2026).
  inscricaoForaValor: 30,
  // Sem valor = camiseta sem preço na página (ainda não existe).
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

// Tamanhos ainda a confirmar com o fornecedor (pedido até 24/11).
export const tamanhos = ["P", "M", "G", "GG"] as const;
export type Tamanho = (typeof tamanhos)[number];

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
  tamanho?: Tamanho; // só com camiseta; inscrições antigas não têm
  criadoEm: string;
  pago?: boolean; // marcado no admin: acertou inscrição/camiseta
  pagamentoId?: string; // Pix da participação (de fora), conta Asaas ASAAS_*
  pixPago?: boolean; // Asaas confirmou o Pix da participação
  presente?: boolean; // check-in no dia
};

type Ajuste = { ajuste: string } & Partial<Pick<InscricaoMurph, "pago" | "presente" | "pixPago">>;

/**
 * Quem tem algo a acertar: camiseta (de fora com camiseta já está inscrito por ela),
 * ou de fora sem camiseta e sem o Pix confirmado. Aluno e TotalPass sem camiseta não pagam.
 */
export const devePagar = (i: Pick<InscricaoMurph, "vinculo" | "camiseta" | "pixPago">) =>
  i.camiseta || (i.vinculo === "fora" && !i.pixPago);

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
      // Pix já pago continua valendo se a pessoa se inscrever de novo (troca de bateria).
      const pixAntigo = antes?.pixPago ? { pixPago: true, pagamentoId: antes.pagamentoId } : {};
      byPhone.set(item.whatsapp, { ...item, pago: antes?.pago, presente: antes?.presente, ...pixAntigo });
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

/** Camisetas por tamanho, para o pedido ao fornecedor. `semTamanho` = pediu camiseta antes de existir o campo. */
export function contarTamanhos(lista: InscricaoMurph[]) {
  const porTamanho = Object.fromEntries(tamanhos.map((t) => [t, 0])) as Record<Tamanho, number>;
  let semTamanho = 0;
  for (const i of lista) {
    if (!i.camiseta) continue;
    if (i.tamanho && i.tamanho in porTamanho) porTamanho[i.tamanho]++;
    else semTamanho++;
  }
  return { porTamanho, semTamanho };
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
    `${vinculoOptions[inscricao.vinculo]} · ${versaoOptions[inscricao.versao]}${inscricao.camiseta ? ` · camiseta ${inscricao.tamanho ?? "sem tamanho"}` : ""}`,
    `Bateria ${bateriaLabel(inscricao.bateria)}: ${naBateria}/${murph.vagasPorBateria}`,
    ...(inscricao.pagamentoId && !inscricao.pixPago ? [`Pix de R$ ${murph.inscricaoForaValor} gerado (aguardando)`] : []),
    `wa.me/${inscricao.whatsapp}`,
    `Total: ${total}`,
  ].join("\n");

  await enviarWhatsapp(AVISO_WHATSAPP, text);
}

// ---- Pix da participação de quem é de fora (mesma conta Asaas do Aulão: ASAAS_*) ----

function asaas<T>(pathname: string, init?: RequestInit): Promise<T> {
  return asaasFetch<T>({ url: process.env.ASAAS_URL ?? ASAAS_URL_PADRAO, apiKey: process.env.ASAAS_API_KEY ?? "" }, pathname, init);
}

export const pixAtivo = () => Boolean(process.env.ASAAS_API_KEY);

export type PixMurph = { paymentId: string; qrCodeImage: string; copiaECola: string; invoiceUrl: string };

export async function criarPixMurph(nome: string, cpf: string, whatsapp: string): Promise<PixMurph> {
  const customer = await asaas<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({ name: nome, cpfCnpj: cpf.replace(/\D/g, ""), mobilePhone: whatsapp.slice(2), notificationDisabled: true }),
  });
  const payment = await asaas<{ id: string; invoiceUrl: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customer.id,
      billingType: "PIX",
      value: murph.inscricaoForaValor,
      dueDate: murph.date,
      description: `${murph.title} · Caiçara Fit · ${murph.dateLabel} · participação (de fora)`,
      externalReference: `murph:${whatsapp}`,
    }),
  });
  const pix = await asaas<{ encodedImage: string; payload: string }>(`/payments/${payment.id}/pixQrCode`);
  return { paymentId: payment.id, qrCodeImage: pix.encodedImage, copiaECola: pix.payload, invoiceUrl: payment.invoiceUrl };
}

const PAGO = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

/** Consulta o Asaas e, se pagou, grava pixPago. Devolve se está pago. */
export async function conferirPix(inscricao: InscricaoMurph): Promise<boolean> {
  if (inscricao.pixPago) return true;
  if (!inscricao.pagamentoId) return false;
  const { status } = await asaas<{ status: string }>(`/payments/${inscricao.pagamentoId}`);
  if (!PAGO.has(status)) return false;
  await emFila(() => atualizarInscricao(inscricao.whatsapp, { pixPago: true }));
  return true;
}
