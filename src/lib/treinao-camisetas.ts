import { createHmac, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { corridaBambu, type PedidoCamiseta, tamanhos } from "@/lib/corrida-bambu";
import { diaSaoPaulo } from "@/lib/entrega-link";

// Link da pessoa que cuida das camisetas do Treinão do Bambu (Gabriel, 27/11/2026).
// Sem senha e sem acesso ao admin: vê e dá baixa SÓ na camiseta do treinão.
// Vale até TREINAO_LINK_ATE (horário de São Paulo). Para cortar antes: trocar ADMIN_COOKIE_SECRET
// ou mudar a data abaixo e subir de novo.
export const TREINAO_LINK_ATE = "2026-11-30";

export function tokenTreinao(): string {
  const chave = process.env.ADMIN_COOKIE_SECRET ?? "";
  if (!chave) throw new Error("ADMIN_COOKIE_SECRET não configurado");
  return createHmac("sha256", chave).update(`treinao-camisetas:${TREINAO_LINK_ATE}`).digest("hex").slice(0, 24);
}

export function tokenTreinaoValido(token: unknown, agora: Date): boolean {
  if (typeof token !== "string" || !/^[0-9a-f]{24}$/.test(token) || !process.env.ADMIN_COOKIE_SECRET) return false;
  if (diaSaoPaulo(agora) > TREINAO_LINK_ATE) return false;
  const esperado = Buffer.from(tokenTreinao());
  const recebido = Buffer.from(token);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

export type Tamanhos = Record<string, number>;

/** Uma venda paga da camiseta, venha da loja ou do /bambu antigo. */
export interface VendaTreinao {
  chave: string; // "loja:22" ou "bambu:pay_x"
  origem: "loja" | "bambu";
  nome: string;
  whatsapp: string;
  itens: Tamanhos;
  situacao: "entregar" | "sem_peca" | "entregue";
  pagoEm: string | null;
  entregueEm: string | null;
  /** Pedido da loja que também tem outro produto: entregar só a camiseta e avisar o Gabriel. */
  outrosItens: boolean;
}

interface LinhaLoja {
  id: number;
  nome: string;
  whatsapp: string;
  status: string;
  pago_em: string | null;
  entregue_em: string | null;
  tamanho: string;
  qtd: number;
  outros: number;
}

export function vendasDaLoja(db: DatabaseSync): VendaTreinao[] {
  const linhas = db
    .prepare(
      `SELECT pe.id, pe.nome, pe.whatsapp, pe.status, pe.pago_em, pe.entregue_em, v.tamanho, i.qtd,
         (SELECT COUNT(*) FROM itens i2 JOIN variacoes v2 ON v2.id = i2.variacao_id
           WHERE i2.pedido_id = pe.id AND v2.produto_id <> pr.id) AS outros
       FROM pedidos pe
       JOIN itens i ON i.pedido_id = pe.id
       JOIN variacoes v ON v.id = i.variacao_id
       JOIN produtos pr ON pr.id = v.produto_id
       WHERE pr.slug = ? AND pe.status IN ('pago', 'pago_sem_peca', 'entregue')
       ORDER BY pe.id`,
    )
    .all(corridaBambu.camiseta.slugLoja) as unknown as LinhaLoja[];
  const porId = new Map<number, VendaTreinao>();
  for (const l of linhas) {
    const v =
      porId.get(l.id) ??
      ({
        chave: `loja:${l.id}`,
        origem: "loja",
        nome: String(l.nome),
        whatsapp: String(l.whatsapp ?? ""),
        itens: {},
        situacao: l.status === "entregue" ? "entregue" : l.status === "pago_sem_peca" ? "sem_peca" : "entregar",
        pagoEm: l.pago_em,
        entregueEm: l.entregue_em,
        outrosItens: Number(l.outros) > 0,
      } satisfies VendaTreinao);
    v.itens[l.tamanho] = (v.itens[l.tamanho] ?? 0) + Number(l.qtd);
    porId.set(l.id, v);
  }
  return [...porId.values()];
}

export function vendasDoBambu(pedidos: PedidoCamiseta[]): VendaTreinao[] {
  return pedidos
    .filter((p) => p.pago)
    .map((p) => ({
      chave: `bambu:${p.id}`,
      origem: "bambu" as const,
      nome: p.nome,
      whatsapp: p.whatsapp,
      itens: Object.fromEntries(tamanhos.filter((t) => p.itens[t]).map((t) => [t, p.itens[t] as number])),
      situacao: p.entregueEm ? ("entregue" as const) : ("entregar" as const),
      pagoEm: p.criadoEm,
      entregueEm: p.entregueEm ?? null,
      outrosItens: false,
    }));
}

export function estoqueDaLoja(db: DatabaseSync): Tamanhos {
  const linhas = db
    .prepare(
      `SELECT v.tamanho, SUM(v.estoque) AS n FROM variacoes v JOIN produtos pr ON pr.id = v.produto_id
       WHERE pr.slug = ? GROUP BY v.tamanho`,
    )
    .all(corridaBambu.camiseta.slugLoja) as unknown as { tamanho: string; n: number }[];
  return Object.fromEntries(linhas.map((l) => [l.tamanho, Number(l.n)]));
}

const somar = (vendas: VendaTreinao[]) => {
  const r: Tamanhos = {};
  for (const v of vendas) for (const [t, n] of Object.entries(v.itens)) r[t] = (r[t] ?? 0) + n;
  return r;
};
export const total = (t: Tamanhos) => Object.values(t).reduce((a, b) => a + b, 0);

/** Números do topo: vendidas, entregues, faltam entregar, por tamanho. */
export function resumo(vendas: VendaTreinao[]) {
  return {
    vendidas: somar(vendas),
    entregues: somar(vendas.filter((v) => v.situacao === "entregue")),
    faltam: somar(vendas.filter((v) => v.situacao !== "entregue")),
  };
}

/** Link do WhatsApp da pessoa (número salvo só com dígitos, com ou sem 55). */
export function linkWhatsapp(numero: string, texto: string): string | null {
  const d = numero.replace(/\D/g, "");
  const n = d.length === 10 || d.length === 11 ? `55${d}` : d.startsWith("55") && d.length >= 12 ? d : null;
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : null;
}

/** Pedidos da loja dessa camiseta ainda esperando pagamento (peças, por tamanho). */
export function aguardandoNaLoja(db: DatabaseSync): Tamanhos {
  const linhas = db
    .prepare(
      `SELECT v.tamanho, SUM(i.qtd) AS n FROM pedidos pe
       JOIN itens i ON i.pedido_id = pe.id JOIN variacoes v ON v.id = i.variacao_id JOIN produtos pr ON pr.id = v.produto_id
       WHERE pr.slug = ? AND pe.status = 'aguardando' GROUP BY v.tamanho`,
    )
    .all(corridaBambu.camiseta.slugLoja) as unknown as { tamanho: string; n: number }[];
  return Object.fromEntries(linhas.map((l) => [l.tamanho, Number(l.n)]));
}
