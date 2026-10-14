// Verificador da loja: a cada 5 min expira reservas, confere pagamentos no Asaas e manda as mensagens.
// Também é disparado pelo webhook do Asaas. Duas rodadas nunca correm juntas no processo (trava em
// globalThis); quem chega com uma rodando pede uma rodada a mais no fim, em vez de correr em paralelo.

import type { DatabaseSync } from "node:sqlite";
import { enviarWhatsapp } from "@/lib/whatsapp";
import { cancelarCobranca, consultarPagamento } from "./cobranca";
import { getDb } from "./db";
import { ehAvisoAoDono, MAX_TENTATIVAS, mensagensDevidas, textoMensagem, type Enviada } from "./mensagens";
import { abertosComCobranca, buscarPorCodigo, expirarVencidos, marcarPago, type PedidoComItens } from "./pedidos";
import type { Pedido, TipoMensagem } from "./tipos";

export const INTERVALO_MS = 5 * 60 * 1000;
const PRIMEIRA_RODADA_MS = 30 * 1000;
const JANELA_DIAS = 3;

export interface DepsCiclo {
  enviarWhatsapp: (numero: string, texto: string) => Promise<boolean>;
  consultarPagamento: (p: Pedido) => Promise<{ pago: boolean; liquido: number | null }>;
  cancelarCobranca: (p: Pedido) => Promise<void>;
}

const depsPadrao: DepsCiclo = { enviarWhatsapp, consultarPagamento, cancelarCobranca };

const estado = globalThis as typeof globalThis & {
  __lojaCicloRodando?: boolean;
  __lojaCicloDeNovo?: boolean;
  __lojaVerificador?: { intervalo: ReturnType<typeof setInterval>; primeira: ReturnType<typeof setTimeout> };
};

const msgErro = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 500);

function linkDo(codigo: string): string {
  return `${process.env.SITE_URL ?? ""}/loja/pedido/${codigo}`;
}

/** Todos os itens do pedido têm estoque suficiente agora? Pedido aguardando já segura as peças. */
function temEstoque(db: DatabaseSync, p: PedidoComItens): boolean {
  if (p.status === "aguardando") return true;
  const precisa = new Map<number, number>();
  for (const i of p.itens) precisa.set(i.variacaoId, (precisa.get(i.variacaoId) ?? 0) + i.qtd);
  const ler = db.prepare("SELECT estoque FROM variacoes WHERE id = ?");
  return [...precisa].every(([id, qtd]) => {
    const r = ler.get(id) as { estoque: number } | undefined;
    return r !== undefined && Number(r.estoque) >= qtd;
  });
}

function pagouOutroDepois(db: DatabaseSync, p: Pedido): boolean {
  const r = db
    .prepare(
      `SELECT 1 FROM pedidos
        WHERE whatsapp = ? AND id <> ? AND status IN ('pago', 'entregue') AND criado_em > ?
        LIMIT 1`,
    )
    .get(p.whatsapp, p.id, p.criadoEm);
  return r !== undefined;
}

function enviadasDe(db: DatabaseSync, pedidoId: number): Enviada[] {
  return (
    db.prepare("SELECT tipo, tentativas, enviada_em FROM mensagens WHERE pedido_id = ?").all(pedidoId) as {
      tipo: TipoMensagem;
      tentativas: number;
      enviada_em: string | null;
    }[]
  ).map((r) => ({ tipo: r.tipo, tentativas: Number(r.tentativas), enviadaEm: r.enviada_em }));
}

/**
 * Reserva uma tentativa ANTES de enviar: cria a linha (UNIQUE pedido_id+tipo) e soma 1 em `tentativas`
 * só se ainda não foi enviada e não estourou o limite. Devolve false se outro já enviou/desistiu.
 */
function reservarTentativa(db: DatabaseSync, pedidoId: number, tipo: TipoMensagem): boolean {
  db.prepare("INSERT INTO mensagens (pedido_id, tipo) VALUES (?, ?) ON CONFLICT (pedido_id, tipo) DO NOTHING").run(
    pedidoId,
    tipo,
  );
  const r = db
    .prepare(
      `UPDATE mensagens SET tentativas = tentativas + 1
        WHERE pedido_id = ? AND tipo = ? AND enviada_em IS NULL AND tentativas < ?`,
    )
    .run(pedidoId, tipo, MAX_TENTATIVAS);
  return r.changes > 0;
}

async function enviarMensagem(
  db: DatabaseSync,
  p: PedidoComItens,
  tipo: TipoMensagem,
  agora: Date,
  deps: DepsCiclo,
): Promise<void> {
  if (!reservarTentativa(db, p.id, tipo)) return;
  const numero = ehAvisoAoDono(tipo) ? process.env.AVISO_WHATSAPP : p.whatsapp;
  let erro: string | null = null;
  if (!numero) {
    erro = ehAvisoAoDono(tipo) ? "AVISO_WHATSAPP não configurado" : "pedido sem WhatsApp";
  } else {
    try {
      if (!(await deps.enviarWhatsapp(numero, textoMensagem(tipo, p, linkDo(p.codigo))))) erro = "envio falhou";
    } catch (e) {
      erro = msgErro(e);
    }
  }
  if (erro) {
    db.prepare("UPDATE mensagens SET erro = ? WHERE pedido_id = ? AND tipo = ?").run(erro, p.id, tipo);
    console.error(`loja: mensagem ${tipo} do pedido ${p.id} falhou: ${erro}`);
  } else {
    db.prepare("UPDATE mensagens SET enviada_em = ?, erro = NULL WHERE pedido_id = ? AND tipo = ?").run(
      agora.toISOString(),
      p.id,
      tipo,
    );
  }
}

async function umaRodada(db: DatabaseSync, agora: Date, deps: DepsCiclo): Promise<void> {
  // 1) Reservas vencidas: expira (devolve estoque) e cancela a cobrança no Asaas.
  let expirados: Pedido[] = [];
  try {
    expirados = expirarVencidos(db, agora);
  } catch (e) {
    console.error("loja: expirar reservas falhou", e);
  }
  for (const p of expirados) {
    try {
      await deps.cancelarCobranca(p);
    } catch (e) {
      console.error(`loja: cancelar cobrança do pedido ${p.id} falhou: ${msgErro(e)}`);
    }
  }

  // 2) Pagamentos: confere cada pedido aguardando que tem cobrança.
  for (const p of abertosComCobranca(db)) {
    try {
      const r = await deps.consultarPagamento(p);
      if (r.pago) marcarPago(db, p.codigo, r.liquido, agora);
    } catch (e) {
      console.error(`loja: consultar pagamento do pedido ${p.id} falhou: ${msgErro(e)}`);
    }
  }

  // 3) Mensagens dos pedidos do site dos últimos dias (criados ou pagos).
  const desde = new Date(agora.getTime() - JANELA_DIAS * 24 * 60 * 60 * 1000).toISOString();
  const codigos = (
    db
      .prepare(
        `SELECT codigo FROM pedidos
          WHERE origem = 'site' AND (criado_em >= ? OR pago_em >= ?)
          ORDER BY id`,
      )
      .all(desde, desde) as { codigo: string }[]
  ).map((r) => r.codigo);

  for (const codigo of codigos) {
    try {
      const p = buscarPorCodigo(db, codigo);
      if (!p) continue;
      const devidas = mensagensDevidas(p, enviadasDe(db, p.id), agora, {
        temEstoque: temEstoque(db, p),
        pagouOutroDepois: pagouOutroDepois(db, p),
      });
      for (const tipo of devidas) await enviarMensagem(db, p, tipo, agora, deps);
    } catch (e) {
      console.error(`loja: mensagens do pedido ${codigo.slice(0, 4)}… falharam: ${msgErro(e)}`);
    }
  }
}

/**
 * Uma rodada completa do verificador. Se já houver uma rodando no processo, não corre junto:
 * marca para a rodada atual repetir no fim (pega o pagamento que o webhook acabou de avisar).
 */
export async function rodarCiclo(db: DatabaseSync, agora: Date, deps: DepsCiclo = depsPadrao): Promise<void> {
  if (estado.__lojaCicloRodando) {
    estado.__lojaCicloDeNovo = true;
    return;
  }
  estado.__lojaCicloRodando = true;
  try {
    do {
      estado.__lojaCicloDeNovo = false;
      await umaRodada(db, agora, deps);
    } while (estado.__lojaCicloDeNovo);
  } finally {
    estado.__lojaCicloRodando = false;
    estado.__lojaCicloDeNovo = false;
  }
}

/** Dispara uma rodada sem esperar (webhook). Erro só vai para o log. */
export function dispararCiclo(): void {
  rodarCiclo(getDb(), new Date()).catch((e) => console.error("loja: ciclo falhou", e));
}

/** Liga o verificador: uma rodada 30 s depois de subir e depois a cada 5 min. Só no servidor. */
export function iniciarVerificador(): void {
  if (estado.__lojaVerificador) return; // hot reload não duplica
  if (process.env.NEXT_PHASE === "phase-production-build" || process.env.VITEST) return;
  estado.__lojaVerificador = {
    primeira: setTimeout(dispararCiclo, PRIMEIRA_RODADA_MS),
    intervalo: setInterval(dispararCiclo, INTERVALO_MS),
  };
}
