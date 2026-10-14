import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const NOME = /^[a-z0-9-]+\.(webp|jpg|jpeg|png)$/;
const TIPOS: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

const naoAchei = () => new Response("Não encontrado", { status: 404 });

export async function GET(_request: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const { arquivo } = await params;
  // O regex já barra "/", "\" e ".."; o nome nunca sai da pasta de fotos.
  const m = NOME.exec(arquivo);
  if (!m) return naoAchei();

  const pasta = path.resolve(process.env.DATA_DIR ?? "data", "loja", "fotos");
  const caminho = path.join(pasta, arquivo);
  if (path.dirname(caminho) !== pasta) return naoAchei();

  let dados: Buffer;
  try {
    dados = await fs.readFile(caminho);
  } catch {
    return naoAchei();
  }

  return new Response(new Uint8Array(dados), {
    headers: {
      "Content-Type": TIPOS[m[1]],
      "Content-Length": String(dados.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
