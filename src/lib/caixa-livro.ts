import { type EntradaAsaas, type ItemAsaas, contasDoMes, hojeSP, lerCaixa, livroDoMes, somaLivro, totaisContas } from "@/lib/caixa";
import { financeiroAtivo, financeiroDoMes } from "@/lib/financeiro/asaas";
import { NOME_ORIGEM } from "@/lib/financeiro/resumo";
import { totalPassDoMes } from "@/lib/financeiro/totalpass";

/** Tudo que a aba Caixa precisa do mês: Asaas + lançamentos + TotalPass (previsto) + contas. */
export async function livroCompleto(mes: string, { recarregar = false } = {}) {
  const hoje = hojeSP();
  const [dados, tp] = await Promise.all([lerCaixa(), totalPassDoMes(mes)]);

  let asaas: EntradaAsaas | null = null;
  let saldoAsaas: number | null = null;
  let asaasErro: string | null = financeiroAtivo() ? null : "Chave do Asaas não configurada no servidor: só aparece o que foi lançado aqui.";
  if (!asaasErro) {
    try {
      const { resumo, saldo } = await financeiroDoMes(mes, { recarregar });
      const porDia = new Map<string, ItemAsaas[]>();
      for (const p of resumo.pagamentos) {
        const lista = porDia.get(p.data) ?? [];
        lista.push({ cliente: p.cliente, descricao: p.descricao, origem: NOME_ORIGEM[p.origem], forma: p.forma, valor: p.valor, parcelas: p.parcelas });
        porDia.set(p.data, lista);
      }
      asaas = { porDia, taxasPorDia: new Map(Object.entries(resumo.taxasPorDia)) };
      saldoAsaas = saldo;
    } catch (e) {
      console.error("[caixa]", e instanceof Error ? e.message.slice(0, 300) : e);
      asaasErro = "O Asaas não respondeu agora: a tabela está sem as entradas dele. Toque em Atualizar daqui a pouco.";
    }
  }

  const dias = livroDoMes(mes, hoje, dados.lancamentos, asaas, { porDia: tp.porDia, repasse: tp.repassePorDia });
  const contas = totaisContas(contasDoMes(dados, mes, hoje));
  return { hoje, dias, soma: somaLivro(dias), contas, asaasErro, saldoAsaas, totalpassImportado: tp.checkins > 0 };
}
