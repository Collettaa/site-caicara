import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { checkinsDaPlanilha, lerXlsx, resumoTotalPass } from "@/lib/financeiro/totalpass";

// xlsx mínimo no formato da exportação de tokens da TotalPass (cabeçalho na 4ª linha)
function xlsx(linhas: string[][]) {
  const strings: string[] = [];
  const idx = (s: string) => (strings.includes(s) ? strings.indexOf(s) : strings.push(s) - 1);
  const letra = (n: number) => String.fromCharCode(65 + n);
  const rows = linhas
    .map((l, r) => `<row r="${r + 1}">${l.map((c, k) => `<c r="${letra(k)}${r + 1}" t="s"><v>${idx(c)}</v></c>`).join("")}</row>`)
    .join("");
  return zipSync({
    "xl/worksheets/sheet1.xml": strToU8(`<worksheet><sheetData>${rows}</sheetData></worksheet>`),
    "xl/sharedStrings.xml": strToU8(`<sst>${strings.map((s) => `<si><t>${s.replace(/&/g, "&amp;")}</t></si>`).join("")}</sst>`),
  });
}

const planilha = xlsx([
  ["Criado em", "16 de Outubro de 2026"],
  ["Descrição", "Planilha listando todos os tokens"],
  [],
  ["ID", "Código", "Nome", "Plano da academia", "Colaborador", "Repasse", "Motivo", "Validado em"],
  ["t1", "A", "C F CAICARA", "CROSSFIT", "Ana & Cia", " 16,07", "Check-in regular", "16/10/2026 18:03:16"],
  ["t2", "B", "C F CAICARA", "CROSSFIT", "Bruno", " 16,07", "Check-in regular", "16/10/2026 07:00:00"],
  ["t3", "C", "C F CAICARA", "CROSSFIT", "Ana & Cia", " 16,07", "Check-in regular", "08/10/2026 18:00:00"],
  ["t4", "D", "C F CAICARA", "CROSSFIT", "Ana & Cia", " 16,07", "Check-in regular", "30/09/2026 18:00:00"],
]);

describe("TotalPass", () => {
  it("lê a planilha de tokens e acha o cabeçalho", () => {
    const c = checkinsDaPlanilha(lerXlsx(planilha));
    expect(c).toHaveLength(4);
    expect(c[0]).toEqual({ id: "t1", quando: "2026-10-16T18:03:16-03:00", pessoa: "Ana & Cia", repasse: 16.07 });
  });

  it("resumo do mês: só outubro, por dia e por pessoa", () => {
    const r = resumoTotalPass(checkinsDaPlanilha(lerXlsx(planilha)), "2026-10");
    expect(r).toMatchObject({ checkins: 3, pessoas: 2, previsto: 48.21, primeiro: "2026-10-08", ultimo: "2026-10-16" });
    expect(r.porDia[15]).toBe(2);
    expect(r.maisFrequentes[0]).toEqual({ pessoa: "Ana & Cia", checkins: 2 });
  });

  it("planilha errada dá erro claro", () => {
    expect(() => checkinsDaPlanilha([["Nome", "Valor"]])).toThrow(/TotalPass/);
  });
});
