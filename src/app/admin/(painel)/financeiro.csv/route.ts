import { exigirAdmin } from "@/lib/admin-auth";
import { financeiroDoMes, mesValido } from "@/lib/financeiro/asaas";
import { financeiroCsv, financeiroDiasCsv } from "@/lib/financeiro/resumo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await exigirAdmin();
  const params = new URL(request.url).searchParams;
  const mes = mesValido(params.get("mes") ?? undefined);
  const porDia = params.get("tipo") === "dias";
  const { resumo } = await financeiroDoMes(mes);
  return new Response(porDia ? financeiroDiasCsv(resumo) : financeiroCsv(resumo), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="financeiro-asaas-${mes}${porDia ? "-por-dia" : ""}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
