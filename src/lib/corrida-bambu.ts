import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ASAAS_URL_PADRAO, asaasFetch } from "@/lib/asaas";
import { enviarWhatsapp } from "@/lib/whatsapp";

export { formatWhatsapp, isValidCpf, normalizeWhatsapp } from "@/lib/contato";

// Corrida leve e grátis na inauguração do Bambu Gastro Bar (Gabriel, 16/11/2026).
export const corridaBambu = {
  title: "Corrida de inauguração do Bambu Gastro Bar",
  date: "2026-11-27",
  dateLabel: "Sexta, 27/11",
  hora: "20h",
  // null = a página não mostra a linha.
  local: "Av. Ayrton Senna, quiosque 47B, Itararé" as string | null, // Gabriel, 19/11
  mapa: "https://www.google.com/maps/search/?api=1&query=Av.+Ayrton+Senna+quiosque+47B+Itarar%C3%A9+S%C3%A3o+Vicente+SP",
  chegada: "Pagode do Luty RJ", // na chegada da corrida (Gabriel, 19/11)
  percurso: null as string | null,
  inscricoesAbertas: true,
  // Camiseta do evento (Gabriel, 17/11): vendida pelo site, Pix na conta ASAAS_*.
  // Sem preço = mostra a camiseta como "em breve" e não vende. Preço: Gabriel define e vai na
  // variável BAMBU_CAMISETA_VALOR do serviço (muda sem build: docker service update --env-add).
  camiseta: {
    get valor(): number | null {
      const v = Number(process.env.BAMBU_CAMISETA_VALOR);
      return Number.isFinite(v) && v > 0 ? v : null;
    },
    pedidoAte: "2026-11-24", // último dia de pedido, horário de São Paulo
    pedidoAteLabel: "24/11",
    tecido: "Dry fit",
    brinde: "um chope da Everbrew", // quem compra a camiseta ganha (Gabriel, 19/11)
    // Estoque do fornecedor (Gabriel, 19/11). Medidas em cm, tabela do fornecedor.
    estoque: { P: 20, M: 30, G: 20, GG: 10 } as Record<"P" | "M" | "G" | "GG", number>,
    medidas: { P: [70, 50], M: [72, 52], G: [74, 56], GG: [76, 59] } as Record<"P" | "M" | "G" | "GG", [number, number]>,
  },
};

export const tamanhos = ["P", "M", "G", "GG"] as const;
export type Tamanho = (typeof tamanhos)[number];

export type InscricaoBambu = {
  nome: string;
  whatsapp: string;
  criadoEm: string;
  camiseta?: Tamanho; // pediu camiseta
  forma?: Forma; // como escolheu pagar a camiseta
  pagamentoId?: string; // cobrança da camiseta, conta Asaas ASAAS_*
  pixPago?: boolean; // Asaas confirmou o pagamento (Pix ou cartão; nome mantido pelos dados já gravados)
};

type Ajuste = { ajuste: string; pixPago?: boolean };

const hojeSP = (agora = new Date()) => agora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

export const pixAtivo = () => Boolean(process.env.ASAAS_API_KEY);

/** Vende camiseta: tem preço, tem Pix e ainda está no prazo do pedido. */
export function camisetaAberta(agora = new Date()) {
  return corridaBambu.camiseta.valor !== null && pixAtivo() && hojeSP(agora) <= corridaBambu.camiseta.pedidoAte;
}

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

async function marcarPago(whatsapp: string) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(dataFile, `${JSON.stringify({ ajuste: whatsapp, pixPago: true } satisfies Ajuste)}\n`, "utf8");
}

/**
 * Mesmo WhatsApp duas vezes vale a última inscrição.
 * Camiseta já paga continua valendo se a pessoa se inscrever de novo sem pedir outra.
 */
export function juntarInscricoes(raw: string): InscricaoBambu[] {
  const porNumero = new Map<string, InscricaoBambu>();
  for (const linha of raw.split("\n")) {
    if (!linha.trim()) continue;
    try {
      const item = JSON.parse(linha) as InscricaoBambu | Ajuste;
      if ("ajuste" in item) {
        const atual = porNumero.get(item.ajuste);
        if (atual) porNumero.set(item.ajuste, { ...atual, pixPago: item.pixPago ?? atual.pixPago });
        continue;
      }
      const antes = porNumero.get(item.whatsapp);
      porNumero.delete(item.whatsapp);
      const pago =
        antes?.pixPago && !item.camiseta
          ? { camiseta: antes.camiseta, forma: antes.forma, pagamentoId: antes.pagamentoId, pixPago: true }
          : {};
      porNumero.set(item.whatsapp, { ...item, ...pago });
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

// Pedido com pagamento pendente segura a camiseta por 2 horas; pago segura sempre.
const RESERVA_MS = 2 * 60 * 60 * 1000;

/** Quantas camisetas ainda dá pra vender de cada tamanho (estoque − pagas − pendentes recentes). */
export function disponiveis(lista: InscricaoBambu[], agora = Date.now()): Record<Tamanho, number> {
  const livres = { ...corridaBambu.camiseta.estoque };
  for (const i of lista) {
    if (!i.camiseta) continue;
    if (i.pixPago || agora - Date.parse(i.criadoEm) < RESERVA_MS) livres[i.camiseta] -= 1;
  }
  for (const t of tamanhos) livres[t] = Math.max(0, livres[t]);
  return livres;
}

/** Camisetas pagas por tamanho, para o pedido ao fornecedor. */
export function contarCamisetas(lista: InscricaoBambu[]) {
  const pagas = Object.fromEntries(tamanhos.map((t) => [t, 0])) as Record<Tamanho, number>;
  let aguardando = 0;
  for (const i of lista) {
    if (!i.camiseta) continue;
    if (i.pixPago) pagas[i.camiseta] += 1;
    else aguardando += 1;
  }
  return { pagas, aguardando };
}

// Aviso só no WhatsApp do Gabriel. Nada vai para o inscrito.
export async function notifyInscricao(inscricao: InscricaoBambu, total: number) {
  const { AVISO_WHATSAPP } = process.env;
  if (!AVISO_WHATSAPP) return;
  await enviarWhatsapp(
    AVISO_WHATSAPP,
    [
      `🏃 Nova inscrição na corrida do Bambu Gastro Bar`,
      inscricao.nome,
      `wa.me/${inscricao.whatsapp}`,
      inscricao.camiseta ? `Camiseta ${inscricao.camiseta} (${inscricao.forma === "cartao" ? "cartão" : "Pix"} gerado, aguardando)` : null,
      `Total: ${total}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

// ---- Cobrança da camiseta, Pix ou cartão 1x (mesma conta Asaas do Aulão e do Murph: ASAAS_*) ----

function asaas<T>(pathname: string, init?: RequestInit): Promise<T> {
  return asaasFetch<T>({ url: process.env.ASAAS_URL ?? ASAAS_URL_PADRAO, apiKey: process.env.ASAAS_API_KEY ?? "" }, pathname, init);
}

export const formas = ["pix", "cartao"] as const;
export type Forma = (typeof formas)[number];

/** Cobrança da camiseta. Pix vem com QR Code; cartão (1x) paga na página do Asaas (invoiceUrl). */
export type CobrancaBambu = { forma: Forma; paymentId: string; invoiceUrl: string; qrCodeImage?: string; copiaECola?: string };

export async function criarCobrancaCamiseta(nome: string, cpf: string, whatsapp: string, tamanho: Tamanho, forma: Forma): Promise<CobrancaBambu> {
  const valor = corridaBambu.camiseta.valor;
  if (valor === null) throw new Error("camiseta sem preço");
  const customer = await asaas<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({ name: nome, cpfCnpj: cpf.replace(/\D/g, ""), mobilePhone: whatsapp.slice(2), notificationDisabled: true }),
  });
  const payment = await asaas<{ id: string; invoiceUrl: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customer.id,
      billingType: forma === "pix" ? "PIX" : "CREDIT_CARD", // cartão sem parcelas = 1x
      value: valor,
      dueDate: corridaBambu.camiseta.pedidoAte,
      description: `Camiseta ${tamanho} · ${corridaBambu.title} · Caiçara Fit`,
      externalReference: `bambu:${whatsapp}`,
    }),
  });
  if (forma === "cartao") return { forma, paymentId: payment.id, invoiceUrl: payment.invoiceUrl };
  const pix = await asaas<{ encodedImage: string; payload: string }>(`/payments/${payment.id}/pixQrCode`);
  return { forma, paymentId: payment.id, qrCodeImage: pix.encodedImage, copiaECola: pix.payload, invoiceUrl: payment.invoiceUrl };
}

const PAGO = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

/** Consulta o Asaas e, se pagou, grava pixPago. Devolve se está pago. */
export async function conferirPix(inscricao: InscricaoBambu): Promise<boolean> {
  if (inscricao.pixPago) return true;
  if (!inscricao.pagamentoId) return false;
  const { status } = await asaas<{ status: string }>(`/payments/${inscricao.pagamentoId}`);
  if (!PAGO.has(status)) return false;
  await emFila(() => marcarPago(inscricao.whatsapp));
  return true;
}
