import { exigirAdmin } from "@/lib/admin-auth";
import { hojeSP, livroCsv } from "@/lib/caixa";
import { livroCompleto } from "@/lib/caixa-livro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await exigirAdmin();
  const p = new URL(request.url).searchParams.get("mes") ?? "";
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(p) ? p : hojeSP().slice(0, 7);
  const { dias } = await livroCompleto(mes);
  return new Response(livroCsv(dias), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="caixa-${mes}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
