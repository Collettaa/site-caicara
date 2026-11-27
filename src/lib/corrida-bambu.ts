import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ASAAS_URL_PADRAO, asaasFetch } from "@/lib/asaas";
import { enviarWhatsapp } from "@/lib/whatsapp";

export { formatWhatsapp, isValidCpf, normalizeWhatsapp } from "@/lib/contato";

// Treinão grátis na inauguração do Bambu Gastro Bar (Gabriel, 16/11/2026).
// No site é "treinão", nunca "corrida" (Gabriel, 24/11). Só a descrição pode dizer que começa correndo.
export const corridaBambu = {
  title: "Treinão de inauguração do Bambu Gastro Bar",
  date: "2026-11-27",
  dateLabel: "Sexta, 27/11",
  hora: "20h",
  // null = a página não mostra a linha.
  local: "Av. Ayrton Senna, quiosque 47B, Itararé" as string | null, // Gabriel, 19/11
  mapa: "https://www.google.com/maps/search/?api=1&query=Av.+Ayrton+Senna+quiosque+47B+Itarar%C3%A9+S%C3%A3o+Vicente+SP",
  chegada: "Pagode do Luty RJ", // na chegada (Gabriel, 19/11)
  percurso: null as string | null,
  inscricoesAbertas: true,
  // Camiseta do evento (Gabriel, 17/11): vendida pelo site, Pix ou cartão 1x na conta ASAAS_*.
  // Dá pra comprar várias e sem se inscrever no treinão (Gabriel, 19/11).
  // Sem preço = mostra a camiseta como "em breve" e não vende. Preço vai na variável
  // BAMBU_CAMISETA_VALOR do serviço (muda sem build: docker service update --env-add).
  camiseta: {
    get valor(): number | null {
      const v = Number(process.env.BAMBU_CAMISETA_VALOR);
      return Number.isFinite(v) && v > 0 ? v : null;
    },
    pedidoAte: "2026-11-24", // último dia de pedido, horário de São Paulo
    pedidoAteLabel: "24/11",
    tecido: "Dry fit",
    brinde: "um chope da Everbrew", // cada camiseta comprada (Gabriel, 19/11)
    maxPorPedido: 10,
    // Desde 25/11 a camiseta é vendida na loja (Pix ou até 2x no cartão), estoque único lá.
    slugLoja: "camiseta-treinao-bambu",
    // Estoque do fornecedor (Gabriel, 19/11). Medidas em cm, tabela do fornecedor.
    estoque: { P: 20, M: 30, G: 20, GG: 10 } as Record<"P" | "M" | "G" | "GG", number>,
    medidas: { P: [70, 50], M: [72, 52], G: [74, 56], GG: [76, 59] } as Record<"P" | "M" | "G" | "GG", [number, number]>,
  },
};

export const tamanhos = ["P", "M", "G", "GG"] as const;
export type Tamanho = (typeof tamanhos)[number];
export type Itens = Partial<Record<Tamanho, number>>;

export const formas = ["pix", "cartao"] as const;
export type Forma = (typeof formas)[number];

export type InscricaoBambu = { nome: string; whatsapp: string; criadoEm: string };

/** Pedido de camiseta: independe da inscrição. `id` = id da cobrança no Asaas. */
export type PedidoCamiseta = {
  id: string;
  nome: string;
  whatsapp: string;
  itens: Itens;
  total: number;
  forma: Forma;
  criadoEm: string;
  pago?: boolean;
  /** Retirou a camiseta (link da entrega no dia do treinão). */
  entregueEm?: string;
};

const hojeSP = (agora = new Date()) => agora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

export const pixAtivo = () => Boolean(process.env.ASAAS_API_KEY);

/** Vende camiseta: tem preço, tem Asaas e ainda está no prazo do pedido. */
export function camisetaAberta(agora = new Date()) {
  return corridaBambu.camiseta.valor !== null && pixAtivo() && hojeSP(agora) <= corridaBambu.camiseta.pedidoAte;
}

/** Só tamanhos válidos, quantidades inteiras positivas. */
export function limparItens(raw: unknown): Itens {
  const itens: Itens = {};
  if (!raw || typeof raw !== "object") return itens;
  for (const t of tamanhos) {
    const n = Number((raw as Record<string, unknown>)[t]);
    if (Number.isInteger(n) && n > 0) itens[t] = n;
  }
  return itens;
}

export const quantidade = (itens: Itens) => tamanhos.reduce((n, t) => n + (itens[t] ?? 0), 0);

/** "2 M, 1 G" */
export const descreverItens = (itens: Itens) =>
  tamanhos
    .filter((t) => itens[t])
    .map((t) => `${itens[t]} ${t}`)
    .join(", ");

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "corrida-bambu.jsonl");
const pedidosFile = path.join(dataDir, "corrida-bambu-camisetas.jsonl");

// Uma escrita por vez.
let fila: Promise<unknown> = Promise.resolve();
export function emFila<T>(fn: () => Promise<T>): Promise<T> {
  const proximo = fila.then(fn, fn);
  fila = proximo.catch(() => undefined);
  return proximo;
}

async function anexar(arquivo: string, item: object) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(arquivo, `${JSON.stringify(item)}\n`, "utf8");
}

export const saveInscricao = (inscricao: InscricaoBambu) => anexar(dataFile, inscricao);
export const salvarPedido = (pedido: PedidoCamiseta) => anexar(pedidosFile, pedido);

/** Mesmo WhatsApp duas vezes vale a última inscrição. */
export function juntarInscricoes(raw: string): InscricaoBambu[] {
  const porNumero = new Map<string, InscricaoBambu>();
  for (const linha of raw.split("\n")) {
    if (!linha.trim()) continue;
    try {
      const item = JSON.parse(linha) as InscricaoBambu & { ajuste?: string };
      if (item.ajuste) continue; // linha de ajuste do formato antigo
      porNumero.delete(item.whatsapp);
      porNumero.set(item.whatsapp, { nome: item.nome, whatsapp: item.whatsapp, criadoEm: item.criadoEm });
    } catch {
      // linha corrompida não derruba a lista
    }
  }
  return [...porNumero.values()];
}

/** Cada pedido vale por si (a mesma pessoa pode comprar mais de uma vez); ajuste marca pago. */
export function juntarPedidos(raw: string): PedidoCamiseta[] {
  const porId = new Map<string, PedidoCamiseta>();
  for (const linha of raw.split("\n")) {
    if (!linha.trim()) continue;
    try {
      const item = JSON.parse(linha) as PedidoCamiseta | { ajuste: string; pago: boolean } | { entregue: string; em: string };
      if ("entregue" in item) {
        const atual = porId.get(item.entregue);
        if (atual && !atual.entregueEm) porId.set(item.entregue, { ...atual, entregueEm: item.em });
        continue;
      }
      if ("ajuste" in item) {
        const atual = porId.get(item.ajuste);
        if (atual) porId.set(item.ajuste, { ...atual, pago: item.pago });
        continue;
      }
      porId.set(item.id, item);
    } catch {
      // linha corrompida não derruba a lista
    }
  }
  return [...porId.values()];
}

const lerOuVazio = async (arquivo: string) => {
  try {
    return await readFile(arquivo, "utf8");
  } catch {
    return "";
  }
};

export const listInscricoes = async () => juntarInscricoes(await lerOuVazio(dataFile));
/** Marca a retirada de um pedido pago do /bambu (só anexa uma linha; o arquivo nunca é reescrito). */
export async function marcarEntregueBambu(id: string, agora: Date): Promise<boolean> {
  return emFila(async () => {
    const pedido = juntarPedidos(await lerOuVazio(pedidosFile)).find((p) => p.id === id);
    if (!pedido?.pago || pedido.entregueEm) return false;
    await anexar(pedidosFile, { entregue: id, em: agora.toISOString() });
    return true;
  });
}

export const listPedidos = async () => juntarPedidos(await lerOuVazio(pedidosFile));

// Pedido com pagamento pendente segura as camisetas por 2 horas; pago segura sempre.
const RESERVA_MS = 2 * 60 * 60 * 1000;

/** Quantas camisetas ainda dá pra vender de cada tamanho (estoque − pagas − pendentes recentes). */
export function disponiveis(pedidos: PedidoCamiseta[], agora = Date.now()): Record<Tamanho, number> {
  const livres = { ...corridaBambu.camiseta.estoque };
  for (const p of pedidos) {
    if (!p.pago && agora - Date.parse(p.criadoEm) >= RESERVA_MS) continue;
    for (const t of tamanhos) livres[t] -= p.itens[t] ?? 0;
  }
  for (const t of tamanhos) livres[t] = Math.max(0, livres[t]);
  return livres;
}

/** Camisetas pagas por tamanho, para o pedido ao fornecedor; `aguardando` = peças com pagamento pendente. */
export function contarCamisetas(pedidos: PedidoCamiseta[]) {
  const pagas = Object.fromEntries(tamanhos.map((t) => [t, 0])) as Record<Tamanho, number>;
  let aguardando = 0;
  for (const p of pedidos) {
    if (p.pago) for (const t of tamanhos) pagas[t] += p.itens[t] ?? 0;
    else aguardando += quantidade(p.itens);
  }
  return { pagas, aguardando };
}

// Aviso só no WhatsApp do Gabriel. Nada vai para o inscrito.
export async function notifyGabriel(linhas: (string | null)[]) {
  const { AVISO_WHATSAPP } = process.env;
  if (!AVISO_WHATSAPP) return;
  await enviarWhatsapp(AVISO_WHATSAPP, linhas.filter(Boolean).join("\n"));
}

// ---- Cobrança das camisetas, Pix ou cartão 1x (mesma conta Asaas do Aulão e do Murph: ASAAS_*) ----

function asaas<T>(pathname: string, init?: RequestInit): Promise<T> {
  return asaasFetch<T>({ url: process.env.ASAAS_URL ?? ASAAS_URL_PADRAO, apiKey: process.env.ASAAS_API_KEY ?? "" }, pathname, init);
}

/** Pix vem com QR Code; cartão (1x) paga na página do Asaas (invoiceUrl). */
export type CobrancaBambu = { forma: Forma; paymentId: string; invoiceUrl: string; total: number; qrCodeImage?: string; copiaECola?: string };

export async function criarCobranca(nome: string, cpf: string, whatsapp: string, itens: Itens, forma: Forma): Promise<CobrancaBambu> {
  const valor = corridaBambu.camiseta.valor;
  if (valor === null) throw new Error("camiseta sem preço");
  const total = valor * quantidade(itens);
  const customer = await asaas<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({ name: nome, cpfCnpj: cpf.replace(/\D/g, ""), mobilePhone: whatsapp.slice(2), notificationDisabled: true }),
  });
  const payment = await asaas<{ id: string; invoiceUrl: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customer.id,
      billingType: forma === "pix" ? "PIX" : "CREDIT_CARD", // cartão sem parcelas = 1x
      value: total,
      dueDate: corridaBambu.camiseta.pedidoAte,
      description: `Camisetas (${descreverItens(itens)}) · ${corridaBambu.title} · Caiçara Fit`,
      externalReference: `bambu:${whatsapp}`,
    }),
  });
  if (forma === "cartao") return { forma, total, paymentId: payment.id, invoiceUrl: payment.invoiceUrl };
  const pix = await asaas<{ encodedImage: string; payload: string }>(`/payments/${payment.id}/pixQrCode`);
  return { forma, total, paymentId: payment.id, qrCodeImage: pix.encodedImage, copiaECola: pix.payload, invoiceUrl: payment.invoiceUrl };
}

const PAGO = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

/** Consulta o Asaas e, se pagou, grava pago. Devolve se está pago. */
export async function conferirPedido(pedido: PedidoCamiseta): Promise<boolean> {
  if (pedido.pago) return true;
  const { status } = await asaas<{ status: string }>(`/payments/${pedido.id}`);
  if (!PAGO.has(status)) return false;
  await emFila(() => anexar(pedidosFile, { ajuste: pedido.id, pago: true }));
  return true;
}
