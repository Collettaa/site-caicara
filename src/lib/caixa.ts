import { armazem, novoId } from "@/lib/armazem";

// Caixa do admin: o que entra e sai FORA do Asaas (dinheiro, maquininha, Pix no banco),
// as contas do mês (equipe, aluguel...) e as encomendas da loja.
// Regras do CLAUDE.md da Caiçara:
//  - conta a pagar não é saída até ser paga: só vira lançamento no dia do "Paguei" (regra 3);
//  - TotalPass é previsto, nunca soma no caixa (regra 2);
//  - atrasada / vence hoje são calculados na hora, nunca gravados (regra 5);
//  - todo lançamento aceita data retroativa (regra 6).

export type Forma = "dinheiro" | "pix" | "maquininha" | "banco";
export const NOME_FORMA: Record<Forma, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix fora do Asaas",
  maquininha: "Maquininha",
  banco: "Banco / boleto",
};
export const FORMAS = Object.keys(NOME_FORMA) as Forma[];

export type Grupo = "equipe" | "casa" | "outros";
export const NOME_GRUPO: Record<Grupo, string> = { equipe: "Equipe", casa: "Box e contas da casa", outros: "Outras" };
export const GRUPOS = Object.keys(NOME_GRUPO) as Grupo[];

export type Lancamento = {
  id: string;
  /** AAAA-MM-DD, pode ser retroativa. */
  data: string;
  tipo: "entrada" | "saida";
  valor: number;
  descricao: string;
  forma: Forma;
  /** Baixa de conta: qual conta e de qual mês. */
  contaId?: string;
  mesConta?: string;
  encomendaId?: string;
  criadoEm: string;
};

export type Conta = {
  id: string;
  nome: string;
  valor: number;
  /** Dia do mês que vence (31 em mês de 30 dias = dia 30). */
  dia: number;
  grupo: Grupo;
  /** AAAA-MM: primeiro mês que aparece. */
  desde: string;
  /** Só neste mês (conta avulsa). */
  unica?: boolean;
  /** AAAA-MM: último mês (conta encerrada). */
  ate?: string;
  obs?: string;
};

export type StatusEncomenda = "pedido" | "chegou" | "entregue";
export const NOME_STATUS: Record<StatusEncomenda, string> = { pedido: "Encomendado", chegou: "Chegou no box", entregue: "Entregue" };

export type Encomenda = {
  id: string;
  cliente: string;
  item: string;
  qtd: number;
  /** Valor total da encomenda. */
  valor: number;
  status: StatusEncomenda;
  /** AAAA-MM-DD. Presente = pago. */
  pagoEm?: string;
  /** "asaas" = pagou pelo link (já entra no Asaas, não lança de novo). */
  formaPagamento?: Forma | "asaas";
  criadoEm: string;
  obs?: string;
};

export type ParcelaPaga = { n: number; data: string; valor: number };

/** Compra parcelada ou dívida paga em parcelas (ex.: caixa de som 12× que o André vai pagando). */
export type Parcelado = {
  id: string;
  pessoa: string;
  descricao: string;
  total: number;
  parcelas: number;
  /** Dia do mês que vence cada parcela. */
  dia: number;
  /** AAAA-MM da 1ª parcela. */
  inicio: string;
  pagas: ParcelaPaga[];
  criadoEm: string;
  obs?: string;
};

export type DadosCaixa = { contas: Conta[]; lancamentos: Lancamento[]; encomendas: Encomenda[]; parcelados: Parcelado[] };

const centavos = (v: number) => Math.round(v * 100) / 100;

// ---- Datas ----

export function hojeSP(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

export const diasNoMes = (mes: string) => {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
};

export function vizinho(mes: string, passo: number) {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + passo, 1)).toISOString().slice(0, 7);
}

export function dataValida(v: unknown): string | null {
  const t = String(v ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const [a, m, d] = t.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).toISOString().slice(0, 10) === t ? t : null;
}

/** "170", "170,50", "1.200,00", "R$ 45" → número; inválido ou ≤ 0 → null. */
export function valorValido(v: unknown): number | null {
  let t = String(v ?? "").replace(/r\$|\s/gi, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) && n > 0 && n < 1_000_000 ? centavos(n) : null;
}

export const textoLimpo = (v: unknown, max = 200) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);

// ---- Contas do mês ----

export type SituacaoConta = "paga" | "atrasada" | "hoje" | "aberta";

export type ContaDoMes = {
  conta: Conta;
  vence: string;
  situacao: SituacaoConta;
  pagamento?: Lancamento;
};

export function contaValeNoMes(c: Conta, mes: string) {
  if (c.unica) return c.desde === mes;
  return c.desde <= mes && (!c.ate || c.ate >= mes);
}

export function contasDoMes(dados: Pick<DadosCaixa, "contas" | "lancamentos">, mes: string, hoje: string): ContaDoMes[] {
  const ultimo = diasNoMes(mes);
  return dados.contas
    .filter((c) => contaValeNoMes(c, mes))
    .map((conta) => {
      const vence = `${mes}-${String(Math.min(conta.dia, ultimo)).padStart(2, "0")}`;
      const pagamento = dados.lancamentos.find((l) => l.contaId === conta.id && l.mesConta === mes);
      const situacao: SituacaoConta = pagamento ? "paga" : vence < hoje ? "atrasada" : vence === hoje ? "hoje" : "aberta";
      return { conta, vence, situacao, pagamento };
    })
    .sort((a, b) => a.vence.localeCompare(b.vence) || a.conta.nome.localeCompare(b.conta.nome, "pt-BR"));
}

export function totaisContas(itens: ContaDoMes[]) {
  const total = centavos(itens.reduce((t, i) => t + (i.pagamento?.valor ?? i.conta.valor), 0));
  const pago = centavos(itens.filter((i) => i.pagamento).reduce((t, i) => t + i.pagamento!.valor, 0));
  return { total, pago, falta: centavos(total - pago), atrasadas: itens.filter((i) => i.situacao === "atrasada").length };
}

// ---- Parcelados ----

export type SituacaoParcelado = {
  p: Parcelado;
  valorParcela: number;
  pago: number;
  falta: number;
  pagas: number;
  quitado: boolean;
  /** Próxima parcela: número e vencimento — avança do vencimento anterior, nunca da data do pagamento (regra 4). */
  proxima: { n: number; vence: string; valor: number; atrasada: boolean } | null;
};

/** Vencimento da parcela n (1 = mês de início). */
export function vencimentoParcela(p: Pick<Parcelado, "inicio" | "dia">, n: number) {
  const mes = vizinho(p.inicio, n - 1);
  return `${mes}-${String(Math.min(p.dia, diasNoMes(mes))).padStart(2, "0")}`;
}

/** Última parcela leva o arredondamento (400 em 12× = 11 de 33,33 + 1 de 33,37). */
export function valorDaParcela(p: Pick<Parcelado, "total" | "parcelas">, n: number) {
  const base = Math.floor((p.total / p.parcelas) * 100) / 100;
  return n === p.parcelas ? centavos(p.total - base * (p.parcelas - 1)) : base;
}

export function situacaoParcelado(p: Parcelado, hoje: string): SituacaoParcelado {
  const pago = centavos(p.pagas.reduce((t, x) => t + x.valor, 0));
  const quitado = p.pagas.length >= p.parcelas || pago >= p.total - 0.005;
  const n = p.pagas.length + 1;
  const vence = vencimentoParcela(p, n);
  return {
    p,
    valorParcela: valorDaParcela(p, 1),
    pago,
    falta: quitado ? 0 : centavos(p.total - pago),
    pagas: p.pagas.length,
    quitado,
    proxima: quitado ? null : { n, vence, valor: Math.min(valorDaParcela(p, n), centavos(p.total - pago)), atrasada: vence < hoje },
  };
}

export function porPessoa(itens: SituacaoParcelado[]) {
  const mapa = new Map<string, { pessoa: string; total: number; pago: number; falta: number; itens: SituacaoParcelado[] }>();
  for (const s of itens) {
    const chave = s.p.pessoa.toLowerCase();
    const g = mapa.get(chave) ?? { pessoa: s.p.pessoa, total: 0, pago: 0, falta: 0, itens: [] };
    g.total = centavos(g.total + s.p.total);
    g.pago = centavos(g.pago + s.pago);
    g.falta = centavos(g.falta + s.falta);
    g.itens.push(s);
    mapa.set(chave, g);
  }
  return [...mapa.values()].sort((a, b) => b.falta - a.falta || a.pessoa.localeCompare(b.pessoa, "pt-BR"));
}

// ---- Livro-caixa por dia ----

export type ItemAsaas = { cliente: string; descricao: string; origem: string; forma: string; valor: number; parcelas: number };

export type DiaLivro = {
  dia: string;
  /** Pago pelo Asaas (Pix, cartão, boleto do site, link, assinatura). */
  asaas: number;
  /** Entradas lançadas aqui (dinheiro, maquininha, Pix no banco). */
  balcao: number;
  entrou: number;
  /** Saídas lançadas (contas pagas e gastos) + taxas do Asaas. */
  saiu: number;
  taxas: number;
  movimento: number;
  acumulado: number;
  /** TotalPass: check-ins × repasse. Previsto — nunca entra em entrou/acumulado. */
  totalpass: number;
  checkins: number;
  itensAsaas: ItemAsaas[];
  lancamentos: Lancamento[];
};

export type EntradaAsaas = {
  porDia: Map<string, ItemAsaas[]>;
  taxasPorDia: Map<string, number>;
};

export function livroDoMes(
  mes: string,
  hoje: string,
  lancamentos: Lancamento[],
  asaas: EntradaAsaas | null,
  totalpass: { porDia: number[]; repasse: number[] } | null,
): DiaLivro[] {
  if (`${mes}-01` > hoje) return [];
  const ultimo = hoje.startsWith(mes) ? Number(hoje.slice(8, 10)) : diasNoMes(mes);
  let acumulado = 0;
  const dias: DiaLivro[] = [];
  for (let n = 1; n <= ultimo; n++) {
    const dia = `${mes}-${String(n).padStart(2, "0")}`;
    const itensAsaas = asaas?.porDia.get(dia) ?? [];
    const doDia = lancamentos.filter((l) => l.data === dia).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
    const asaasTotal = centavos(itensAsaas.reduce((t, i) => t + i.valor, 0));
    const balcao = centavos(doDia.filter((l) => l.tipo === "entrada").reduce((t, l) => t + l.valor, 0));
    const taxas = centavos(asaas?.taxasPorDia.get(dia) ?? 0);
    const saiu = centavos(doDia.filter((l) => l.tipo === "saida").reduce((t, l) => t + l.valor, 0) + taxas);
    const entrou = centavos(asaasTotal + balcao);
    const movimento = centavos(entrou - saiu);
    acumulado = centavos(acumulado + movimento);
    dias.push({
      dia,
      asaas: asaasTotal,
      balcao,
      entrou,
      saiu,
      taxas,
      movimento,
      acumulado,
      totalpass: centavos(totalpass?.repasse[n - 1] ?? 0),
      checkins: totalpass?.porDia[n - 1] ?? 0,
      itensAsaas,
      lancamentos: doDia,
    });
  }
  return dias;
}

export function somaLivro(dias: DiaLivro[]) {
  const s = (k: "asaas" | "balcao" | "entrou" | "saiu" | "taxas" | "totalpass" | "checkins") =>
    centavos(dias.reduce((t, d) => t + d[k], 0));
  return {
    asaas: s("asaas"),
    balcao: s("balcao"),
    entrou: s("entrou"),
    saiu: s("saiu"),
    taxas: s("taxas"),
    totalpass: s("totalpass"),
    checkins: s("checkins"),
    resultado: centavos(s("entrou") - s("saiu")),
  };
}

/** CSV do livro (separador ;, decimal com vírgula) — abre direto no Sheets/Excel. */
export function livroCsv(dias: DiaLivro[]): string {
  const num = (v: number) => v.toFixed(2).replace(".", ",");
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const linhas = [["data", "tipo", "origem", "descricao", "forma", "valor"].join(";")];
  for (const d of dias) {
    for (const i of d.itensAsaas) linhas.push([d.dia, "entrada", "Asaas", esc(`${i.cliente} · ${i.descricao || i.origem}`), i.forma, num(i.valor)].join(";"));
    for (const l of d.lancamentos) linhas.push([d.dia, l.tipo, "Caixa", esc(l.descricao), NOME_FORMA[l.forma], num(l.tipo === "saida" ? -l.valor : l.valor)].join(";"));
    if (d.taxas) linhas.push([d.dia, "saida", "Asaas", "Taxas do Asaas", "", num(-d.taxas)].join(";"));
    if (d.checkins) linhas.push([d.dia, "previsto", "TotalPass", `${d.checkins} check-ins (não é caixa)`, "", num(d.totalpass)].join(";"));
  }
  return `﻿${linhas.join("\n")}\n`;
}

// ---- Arquivo ----

const loja = armazem<DadosCaixa>("caixa.json", () => ({ contas: [], lancamentos: [], encomendas: [], parcelados: [] }));

export const lerCaixa = loja.ler;

export function lancar(l: Omit<Lancamento, "id" | "criadoEm">) {
  return loja.alterar((d) => {
    const novo: Lancamento = { ...l, id: novoId(), criadoEm: new Date().toISOString() };
    d.lancamentos.push(novo);
    return novo;
  });
}

export function apagarLancamento(id: string) {
  return loja.alterar((d) => {
    const l = d.lancamentos.find((x) => x.id === id);
    d.lancamentos = d.lancamentos.filter((x) => x.id !== id);
    // Apagar o lançamento de uma encomenda desfaz o pago dela.
    if (l?.encomendaId) {
      const e = d.encomendas.find((x) => x.id === l.encomendaId);
      if (e) {
        delete e.pagoEm;
        delete e.formaPagamento;
      }
    }
  });
}

export function salvarConta(id: string | null, c: Omit<Conta, "id">) {
  return loja.alterar((d) => {
    const atual = id ? d.contas.find((x) => x.id === id) : undefined;
    if (atual) {
      Object.assign(atual, c);
      for (const k of ["unica", "ate", "obs"] as const) if (c[k] === undefined) delete atual[k];
      return atual;
    }
    const nova = { ...c, id: novoId() };
    d.contas.push(nova);
    return nova;
  });
}

/** Encerrar: some daqui pra frente e fica no histórico. Pago neste mês = ainda vale neste mês. */
export function encerrarConta(id: string, mes: string) {
  return loja.alterar((d) => {
    const c = d.contas.find((x) => x.id === id);
    if (!c) return;
    const pagaNoMes = d.lancamentos.some((l) => l.contaId === id && l.mesConta === mes);
    const ate = pagaNoMes ? mes : vizinho(mes, -1);
    if (ate < c.desde && !d.lancamentos.some((l) => l.contaId === id)) d.contas = d.contas.filter((x) => x.id !== id);
    else c.ate = ate < c.desde ? c.desde : ate;
  });
}

/** Baixa: vira saída do caixa na data em que pagou (regra 3). Uma por conta por mês. */
export function pagarConta(contaId: string, mes: string, data: string, valor: number, forma: Forma) {
  return loja.alterar((d) => {
    const c = d.contas.find((x) => x.id === contaId);
    if (!c || d.lancamentos.some((l) => l.contaId === contaId && l.mesConta === mes)) return;
    d.lancamentos.push({
      id: novoId(),
      data,
      tipo: "saida",
      valor,
      descricao: c.nome,
      forma,
      contaId,
      mesConta: mes,
      criadoEm: new Date().toISOString(),
    });
  });
}

export function desfazerPagamento(contaId: string, mes: string) {
  return loja.alterar((d) => {
    d.lancamentos = d.lancamentos.filter((l) => !(l.contaId === contaId && l.mesConta === mes));
  });
}

export function salvarEncomenda(id: string | null, e: Pick<Encomenda, "cliente" | "item" | "qtd" | "valor" | "obs">) {
  return loja.alterar((d) => {
    const atual = id ? d.encomendas.find((x) => x.id === id) : undefined;
    if (atual) {
      Object.assign(atual, e);
      if (!e.obs) delete atual.obs;
      return atual;
    }
    const nova: Encomenda = { ...e, id: novoId(), status: "pedido", criadoEm: new Date().toISOString() };
    if (!nova.obs) delete nova.obs;
    d.encomendas.push(nova);
    return nova;
  });
}

export function mudarStatusEncomenda(id: string, status: StatusEncomenda) {
  return loja.alterar((d) => {
    const e = d.encomendas.find((x) => x.id === id);
    if (e) e.status = status;
  });
}

/** Pago fora do Asaas vira entrada no caixa; pago pelo link do Asaas já aparece no Asaas. */
export function pagarEncomenda(id: string, data: string, forma: Forma | "asaas") {
  return loja.alterar((d) => {
    const e = d.encomendas.find((x) => x.id === id);
    if (!e || e.pagoEm) return;
    e.pagoEm = data;
    e.formaPagamento = forma;
    if (forma !== "asaas") {
      d.lancamentos.push({
        id: novoId(),
        data,
        tipo: "entrada",
        valor: e.valor,
        descricao: `Encomenda: ${e.qtd > 1 ? `${e.qtd}× ` : ""}${e.item} · ${e.cliente}`,
        forma,
        encomendaId: e.id,
        criadoEm: new Date().toISOString(),
      });
    }
  });
}

export function desfazerPagoEncomenda(id: string) {
  return loja.alterar((d) => {
    const e = d.encomendas.find((x) => x.id === id);
    if (!e) return;
    delete e.pagoEm;
    delete e.formaPagamento;
    d.lancamentos = d.lancamentos.filter((l) => l.encomendaId !== id);
  });
}

export function apagarEncomenda(id: string) {
  return loja.alterar((d) => {
    d.encomendas = d.encomendas.filter((x) => x.id !== id);
    d.lancamentos = d.lancamentos.filter((l) => l.encomendaId !== id);
  });
}

export function salvarParcelado(id: string | null, x: Pick<Parcelado, "pessoa" | "descricao" | "total" | "parcelas" | "dia" | "inicio" | "obs">) {
  return loja.alterar((d) => {
    const atual = id ? d.parcelados.find((p) => p.id === id) : undefined;
    if (atual) {
      Object.assign(atual, x);
      if (!x.obs) delete atual.obs;
      return atual;
    }
    const novo: Parcelado = { ...x, id: novoId(), pagas: [], criadoEm: new Date().toISOString() };
    if (!novo.obs) delete novo.obs;
    d.parcelados.push(novo);
    return novo;
  });
}

/** Baixa da próxima parcela (valor pode ser diferente: pagou a mais ou a menos). */
export function pagarParcela(id: string, data: string, valor: number) {
  return loja.alterar((d) => {
    const p = d.parcelados.find((x) => x.id === id);
    if (!p || p.pagas.length >= p.parcelas) return;
    p.pagas.push({ n: p.pagas.length + 1, data, valor });
  });
}

export function desfazerParcela(id: string) {
  return loja.alterar((d) => {
    d.parcelados.find((x) => x.id === id)?.pagas.pop();
  });
}

export function apagarParcelado(id: string) {
  return loja.alterar((d) => {
    d.parcelados = d.parcelados.filter((x) => x.id !== id);
  });
}
