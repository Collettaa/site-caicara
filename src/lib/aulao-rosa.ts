import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ASAAS_URL_PADRAO, asaasFetch } from "@/lib/asaas";
import { enviarWhatsapp } from "@/lib/whatsapp";

export { formatWhatsapp, isValidCpf, normalizeWhatsapp } from "@/lib/contato";

export const aulaoRosa = {
  title: "Aulão Rosa",
  date: "2026-10-18",
  dateLabel: "Domingo, 18/10, às 9h",
  avulsaValor: 15,
  teacher: "prof. Maria",
  location: "Caiçara Fit · Av. Embaixador Pedro de Toledo, 593, São Vicente",
};

export const vinculoOptions = {
  aluno: "Aluno Caiçara",
  totalpass: "TotalPass",
  avulsa: "Avulsa (Pix R$ 15)",
} as const;

export type Vinculo = keyof typeof vinculoOptions;

export type Inscricao = {
  nome: string;
  whatsapp: string;
  vinculo: Vinculo;
  criadoEm: string;
  pagamentoId?: string;
};

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "aulao-rosa.jsonl");

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
    `${vinculoOptions[inscricao.vinculo]}${inscricao.pagamentoId ? " · Pix de R$ 15 gerado" : ""}`,
    `wa.me/${inscricao.whatsapp}`,
    `Total: ${total}`,
  ].join("\n");

  await enviarWhatsapp(AVISO_WHATSAPP, text);
}

// Cobrança Pix da aula avulsa pelo Asaas.
// Conta do Aulão: ASAAS_* (a loja tem a dela, LOJA_ASAAS_*).
function asaas<T>(pathname: string, init?: RequestInit): Promise<T> {
  return asaasFetch<T>(
    { url: process.env.ASAAS_URL ?? ASAAS_URL_PADRAO, apiKey: process.env.ASAAS_API_KEY ?? "" },
    pathname,
    init,
  );
}

export const asaasEnabled = () => Boolean(process.env.ASAAS_API_KEY);

export type PixCharge = {
  paymentId: string;
  qrCodeImage: string;
  copiaECola: string;
  invoiceUrl: string;
};

export async function createPixCharge(nome: string, cpf: string, whatsapp: string): Promise<PixCharge> {
  const customer = await asaas<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: nome,
      cpfCnpj: cpf.replace(/\D/g, ""),
      mobilePhone: whatsapp.slice(2),
      notificationDisabled: true,
    }),
  });

  const payment = await asaas<{ id: string; invoiceUrl: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customer.id,
      billingType: "PIX",
      value: aulaoRosa.avulsaValor,
      dueDate: aulaoRosa.date,
      description: `${aulaoRosa.title} · Caiçara Fit · ${aulaoRosa.dateLabel} · aula avulsa`,
      externalReference: `aulao-rosa:${whatsapp}`,
    }),
  });

  const pix = await asaas<{ encodedImage: string; payload: string }>(`/payments/${payment.id}/pixQrCode`);

  return {
    paymentId: payment.id,
    qrCodeImage: pix.encodedImage,
    copiaECola: pix.payload,
    invoiceUrl: payment.invoiceUrl,
  };
}

const paidStatuses = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

export async function isPixPaid(paymentId: string) {
  const payment = await asaas<{ status: string }>(`/payments/${paymentId}`);
  return paidStatuses.has(payment.status);
}
