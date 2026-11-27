import { conferirPedido, listPedidos } from "@/lib/corrida-bambu";
import { getDb } from "@/lib/loja/db";
import { aguardandoNaLoja, estoqueDaLoja, resumo, vendasDaLoja, vendasDoBambu } from "@/lib/treinao-camisetas";

// Fonte única dos números da camiseta do treinão: o admin (aba Treinão) e o link da entrega
// leem daqui, então nunca mostram números diferentes.
// Loja: pago/entregue vêm do banco (webhook do Asaas + verificador). /bambu antigo: pedido pendente
// é conferido no Asaas no máximo a cada 60 s (Pix vencido ainda pode ser pago).

let ultimaConferencia = 0;

async function conferirPendentesDoBambu(): Promise<void> {
  if (Date.now() - ultimaConferencia < 60_000) return;
  ultimaConferencia = Date.now();
  const pendentes = (await listPedidos()).filter((p) => !p.pago);
  await Promise.all(pendentes.map((p) => conferirPedido(p).catch(() => false)));
}

export async function dadosDoTreinao() {
  try {
    await conferirPendentesDoBambu();
  } catch (e) {
    console.error("[treinao] conferir pendentes do /bambu falhou", e instanceof Error ? e.message.slice(0, 200) : e);
  }
  const db = getDb();
  const antigos = await listPedidos();
  const vendas = [...vendasDaLoja(db), ...vendasDoBambu(antigos)];
  const aguardando = aguardandoNaLoja(db);
  for (const p of antigos) {
    if (p.pago) continue;
    for (const [t, n] of Object.entries(p.itens)) aguardando[t] = (aguardando[t] ?? 0) + (n ?? 0);
  }
  return { vendas, estoque: estoqueDaLoja(db), resumo: resumo(vendas), aguardando, pendentesBambu: antigos.filter((p) => !p.pago) };
}
