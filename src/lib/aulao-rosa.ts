import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

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
    `${vinculoOptions[inscricao.vinculo]}${inscricao.pagamentoId ? " · Pix de R$ 15 gerado" : ""}`,
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

export function isValidCpf(value: string) {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  for (const size of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < size; i++) sum += Number(cpf[i]) * (size + 1 - i);
    const digit = ((sum * 10) % 11) % 10;
    if (digit !== Number(cpf[size])) return false;
  }
  return true;
}

// Cobrança Pix da aula avulsa pelo Asaas.
async function asaas<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${process.env.ASAAS_URL ?? "https://api.asaas.com/v3"}${pathname}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "caicara-site",
      access_token: process.env.ASAAS_API_KEY ?? "",
    },
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`asaas ${pathname} ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
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
