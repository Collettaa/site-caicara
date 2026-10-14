import { exigirAdmin } from "@/lib/admin-auth";
import { STATUS_VENDA, vendasCsv } from "@/lib/loja/csv";
import { getDb } from "@/lib/loja/db";
import { listarPorStatus } from "@/lib/loja/pedidos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hojeSP = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

export async function GET() {
  await exigirAdmin();
  const csv = vendasCsv(listarPorStatus(getDb(), STATUS_VENDA));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendas-loja-${hojeSP.format(new Date())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
