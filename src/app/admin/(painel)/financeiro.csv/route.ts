import { exigirAdmin } from "@/lib/admin-auth";
import { financeiroDoMes, mesValido } from "@/lib/financeiro/asaas";
import { financeiroCsv } from "@/lib/financeiro/resumo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await exigirAdmin();
  const mes = mesValido(new URL(request.url).searchParams.get("mes") ?? undefined);
  const { resumo } = await financeiroDoMes(mes);
  return new Response(financeiroCsv(resumo), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="financeiro-asaas-${mes}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
