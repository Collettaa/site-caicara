import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { strFromU8, unzipSync } from "fflate";

// TotalPass: check-in é PREVISTO A RECEBER, nunca caixa (regra 2 do CLAUDE.md).
// Caixa só quando o depósito da plataforma cai — e aí ele aparece no banco, não aqui.
// Fonte: planilha "tokens" exportada do painel da TotalPass (.xlsx), importada no admin.

export type Checkin = { id: string; quando: string; pessoa: string; repasse: number };

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const arquivo = path.join(dataDir, "totalpass.json");

const xmlTexto = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** Lê a 1ª aba de um .xlsx como linhas de texto (só o que a planilha da TotalPass precisa). */
export function lerXlsx(bytes: Uint8Array): string[][] {
  const zip = unzipSync(bytes);
  const comp = zip["xl/sharedStrings.xml"] ? strFromU8(zip["xl/sharedStrings.xml"]) : "";
  const compartilhados = [...comp.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => xmlTexto(m[1]));
  const aba = Object.keys(zip).filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0];
  if (!aba) throw new Error("planilha sem aba");
  const xml = strFromU8(zip[aba]);
  const linhas: string[][] = [];
  for (const [, corpo] of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const linha: string[] = [];
    for (const [, attrs, dentro] of corpo.matchAll(/<c([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1] ?? "";
      const col = [...ref].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const tipo = /t="([^"]+)"/.exec(attrs)?.[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(dentro ?? "")?.[1];
      let texto = "";
      if (tipo === "s" && v !== undefined) texto = compartilhados[Number(v)] ?? "";
      else if (tipo === "inlineStr") texto = xmlTexto(/<is>([\s\S]*?)<\/is>/.exec(dentro ?? "")?.[1] ?? "");
      else if (v !== undefined) texto = xmlTexto(v);
      if (col >= 0) linha[col] = texto;
    }
    linhas.push(Array.from(linha, (c) => c ?? ""));
  }
  return linhas;
}

const numero = (s: string) => Number(s.trim().replace(/\./g, "").replace(",", "."));

/** "16/10/2026 18:03:16" (horário de Brasília) → ISO com -03:00. */
function dataTotalPass(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/.exec(s.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6] ?? "00"}-03:00` : null;
}

/** Acha o cabeçalho (ID, Colaborador, Repasse, Validado em) e devolve os check-ins válidos. */
export function checkinsDaPlanilha(linhas: string[][]): Checkin[] {
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  const i = linhas.findIndex((l) => l.some((c) => norm(c) === "colaborador") && l.some((c) => norm(c) === "repasse"));
  if (i < 0) throw new Error("não achei as colunas Colaborador e Repasse — é a planilha de tokens da TotalPass?");
  const cab = linhas[i].map(norm);
  const col = (nome: string) => cab.indexOf(nome);
  const [cId, cPessoa, cRepasse, cQuando] = [col("id"), col("colaborador"), col("repasse"), col("validado em")];
  const saida: Checkin[] = [];
  for (const l of linhas.slice(i + 1)) {
    const id = l[cId]?.trim();
    const quando = dataTotalPass(l[cQuando] ?? "");
    const repasse = numero(l[cRepasse] ?? "");
    if (!id || !quando || !Number.isFinite(repasse)) continue;
    saida.push({ id, quando, pessoa: (l[cPessoa] ?? "").trim(), repasse });
  }
  return saida;
}

async function lerTodos(): Promise<Record<string, Omit<Checkin, "id">>> {
  try {
    return JSON.parse(await readFile(arquivo, "utf8"));
  } catch {
    return {};
  }
}

/** Junta com o que já foi importado (o ID do token não repete: importar de novo não duplica). */
export async function importarCheckins(novos: Checkin[]) {
  const todos = await lerTodos();
  const antes = Object.keys(todos).length;
  for (const { id, ...resto } of novos) todos[id] = resto;
  await mkdir(dataDir, { recursive: true });
  const tmp = `${arquivo}.tmp`;
  await writeFile(tmp, JSON.stringify(todos), "utf8");
  await rename(tmp, arquivo);
  return { novos: Object.keys(todos).length - antes, total: Object.keys(todos).length };
}

export type TotalPassMes = {
  checkins: number;
  pessoas: number;
  previsto: number;
  porDia: number[]; // check-ins por dia do mês (índice 0 = dia 1)
  primeiro: string | null;
  ultimo: string | null;
  maisFrequentes: { pessoa: string; checkins: number }[];
};

export function resumoTotalPass(todos: Checkin[], mes: string): TotalPassMes {
  const [a, m] = mes.split("-").map(Number);
  const dias = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const doMes = todos.filter((c) => c.quando.startsWith(mes)).sort((x, y) => x.quando.localeCompare(y.quando));
  const porDia = Array.from({ length: dias }, () => 0);
  const porPessoa = new Map<string, number>();
  for (const c of doMes) {
    porDia[Number(c.quando.slice(8, 10)) - 1] += 1;
    porPessoa.set(c.pessoa, (porPessoa.get(c.pessoa) ?? 0) + 1);
  }
  return {
    checkins: doMes.length,
    pessoas: porPessoa.size,
    previsto: Math.round(doMes.reduce((t, c) => t + c.repasse, 0) * 100) / 100,
    porDia,
    primeiro: doMes[0]?.quando.slice(0, 10) ?? null,
    ultimo: doMes.at(-1)?.quando.slice(0, 10) ?? null,
    maisFrequentes: [...porPessoa.entries()]
      .map(([pessoa, checkins]) => ({ pessoa, checkins }))
      .sort((x, y) => y.checkins - x.checkins || x.pessoa.localeCompare(y.pessoa, "pt-BR"))
      .slice(0, 10),
  };
}

export async function totalPassDoMes(mes: string): Promise<TotalPassMes> {
  const todos = Object.entries(await lerTodos()).map(([id, c]) => ({ id, ...c }));
  return resumoTotalPass(todos, mes);
}
