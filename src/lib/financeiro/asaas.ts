import { ASAAS_URL_PADRAO, asaasFetch } from "@/lib/asaas";
import { type Cobranca, type Movimento, type ResumoMes, montarResumo } from "@/lib/financeiro/resumo";

// A conta da Caiçara é uma só; a chave da loja é a que está valendo (16/10/2026).
const cfg = () => ({
  url: process.env.LOJA_ASAAS_URL ?? ASAAS_URL_PADRAO,
  apiKey: process.env.LOJA_ASAAS_API_KEY ?? "",
});

type Pagina<T> = { data: T[]; hasMore: boolean };
const MAX_PAGINAS = 20;

async function tudo<T>(caminho: string): Promise<T[]> {
  const itens: T[] = [];
  const sep = caminho.includes("?") ? "&" : "?";
  for (let p = 0; p < MAX_PAGINAS; p++) {
    const r = await asaasFetch<Pagina<T>>(cfg(), `${caminho}${sep}limit=100&offset=${p * 100}`);
    itens.push(...r.data);
    if (!r.hasMore) break;
  }
  return itens;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function limites(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const inicio = new Date(Date.UTC(a, m - 1, 1));
  const fim = new Date(Date.UTC(a, m, 0));
  // cobrança paga no mês costuma ser criada até ~40 dias antes (boleto, recorrência)
  const criadaDesde = new Date(inicio.getTime() - 45 * 864e5);
  return { inicio: iso(inicio), fim: iso(fim), criadaDesde: iso(criadaDesde) };
}

export const hojeSP = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

export const financeiroAtivo = () => Boolean(process.env.LOJA_ASAAS_API_KEY);

const cache = new Map<string, { em: number; valor: Promise<{ resumo: ResumoMes; saldo: number }> }>();
const CACHE_MS = 5 * 60 * 1000;

async function buscar(mes: string, hoje: string) {
  const { inicio, fim, criadaDesde } = limites(mes);
  const [pagasOuNoMes, abertas, extrato, clientes, saldo] = await Promise.all([
    tudo<Cobranca>(`/payments?dateCreated[ge]=${criadaDesde}&dateCreated[le]=${fim}`),
    Promise.all([tudo<Cobranca>("/payments?status=PENDING"), tudo<Cobranca>("/payments?status=OVERDUE")]).then((x) => x.flat()),
    tudo<Movimento>(`/financialTransactions?startDate=${inicio}&finishDate=${fim}`),
    tudo<{ id: string; name: string }>("/customers"),
    asaasFetch<{ balance: number }>(cfg(), "/finance/balance"),
  ]);
  const porId = new Map<string, Cobranca>();
  for (const c of [...pagasOuNoMes, ...abertas]) porId.set(c.id, c);
  const nomes = new Map(clientes.map((c) => [c.id, c.name]));
  return { resumo: montarResumo(mes, hoje, [...porId.values()], extrato, nomes), saldo: saldo.balance };
}

/** Mês do Asaas, guardado 5 min (abrir a aba de novo não refaz 10 chamadas). */
export function financeiroDoMes(mes: string, { recarregar = false } = {}) {
  const hoje = hojeSP();
  const chave = `${mes}|${hoje}`;
  const guardado = cache.get(chave);
  if (!recarregar && guardado && Date.now() - guardado.em < CACHE_MS) return guardado.valor;
  const valor = buscar(mes, hoje);
  cache.set(chave, { em: Date.now(), valor });
  valor.catch(() => cache.delete(chave)); // erro não fica guardado
  return valor;
}

export function mesValido(mes: string | undefined): string {
  return mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes) ? mes : hojeSP().slice(0, 7);
}
