import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// O layout não basta: numa navegação RSC com o layout já "carregado" no
// Next-Router-State-Tree, o Next renderiza só a page e pula o layout.
// Por isso toda page do painel confere a sessão na primeira linha.

const RAIZ = join(process.cwd(), "src", "app", "admin", "(painel)");

function paginas(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return paginas(caminho);
    return /^(page|layout)\.tsx$/.test(nome) ? [caminho] : [];
  });
}

describe("painel admin", () => {
  const arquivos = paginas(RAIZ);

  it("acha as pages", () => {
    expect(arquivos.length).toBeGreaterThanOrEqual(5);
  });

  it.each(arquivos.map((a) => [a.slice(RAIZ.length + 1), a]))(
    "%s chama exigirAdmin() na primeira linha",
    (_nome, arquivo) => {
      const fonte = readFileSync(arquivo, "utf8");
      const inicio = fonte.indexOf("export default async function");
      expect(inicio, "default export precisa ser async").toBeGreaterThanOrEqual(0);
      const corpo = fonte.indexOf(") {", inicio);
      expect(fonte.slice(corpo + 3).trimStart().startsWith("await exigirAdmin();")).toBe(true);
    },
  );
});
