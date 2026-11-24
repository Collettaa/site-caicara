import { NextResponse } from "next/server";
import { agoraSP, listarLembretes, marcarResultado, proximoLembrete, quandoValido, salvarLembrete } from "@/lib/lembretes";
import { chaveValida, limparTexto } from "@/lib/pendencias";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rotina da VPS (lembretes_grupo.py) e sessões do Claude. Mesma chave das pendências (x-chave).
const negado = () => NextResponse.json({ error: "Chave inválida." }, { status: 401 });

export async function GET(request: Request) {
  if (!chaveValida(request.headers.get("x-chave"))) return negado();
  return NextResponse.json({ agora: agoraSP(), lembretes: await listarLembretes() });
}

/**
 * { "acao": "proximo" } → { enviar: Lembrete | null, pulados }
 * { "acao": "enviado", "id" } · { "acao": "erro", "id", "erro" }
 * { "acao": "novo", "data": "AAAA-MM-DD", "hora": "HH:MM", "texto", "assunto"?, "enviadoEm"?, "pulado"? }
 */
export async function POST(request: Request) {
  if (!chaveValida(request.headers.get("x-chave"))) return negado();
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const acao = b?.acao;
  if (acao === "proximo") return NextResponse.json(await proximoLembrete(agoraSP()));
  if (acao === "enviado" || acao === "erro") {
    const ok = await marcarResultado(String(b?.id ?? ""), acao === "enviado" ? { enviadoEm: new Date().toISOString() } : { erro: String(b?.erro ?? "falhou") });
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  }
  if (acao === "novo") {
    const quando = quandoValido(b?.data, b?.hora);
    const texto = String(b?.texto ?? "").trim().slice(0, 4000);
    if (!quando || texto.length < 2) return NextResponse.json({ error: "Falta data, hora ou texto." }, { status: 400 });
    const l = await salvarLembrete(null, { quando, texto, grupo: "alunos", assunto: limparTexto(b?.assunto).slice(0, 40) || undefined });
    if (typeof b?.enviadoEm === "string" || b?.pulado) {
      await marcarResultado(l.id, { enviadoEm: typeof b?.enviadoEm === "string" ? b.enviadoEm : undefined, pulado: Boolean(b?.pulado) });
    }
    return NextResponse.json(l, { status: 201 });
  }
  return NextResponse.json({ error: "acao: proximo, enviado, erro ou novo." }, { status: 400 });
}
