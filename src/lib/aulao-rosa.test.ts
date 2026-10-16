import { describe, expect, it } from "vitest";
import { juntarInscricoes } from "@/lib/aulao-rosa";

const linha = (o: object) => JSON.stringify(o);
const ana = { nome: "Ana", whatsapp: "5513999990001", vinculo: "avulsa", criadoEm: "2026-10-10T10:00:00Z" };
const bia = { nome: "Bia", whatsapp: "5513999990002", vinculo: "aluno", criadoEm: "2026-10-10T11:00:00Z" };

describe("juntarInscricoes", () => {
  it("ajuste muda o campo sem mudar a ordem", () => {
    const raw = [linha(ana), linha(bia), linha({ ajuste: ana.whatsapp, pagoPorFora: true })].join("\n");
    const lista = juntarInscricoes(raw);
    expect(lista.map((i) => i.nome)).toEqual(["Ana", "Bia"]);
    expect(lista[0].pagoPorFora).toBe(true);
  });

  it("desmarcar volta ao normal", () => {
    const raw = [linha(ana), linha({ ajuste: ana.whatsapp, presente: true }), linha({ ajuste: ana.whatsapp, presente: false })].join("\n");
    expect(juntarInscricoes(raw)[0].presente).toBe(false);
  });

  it("reinscrição mantém o que foi marcado e ajuste de quem não existe é ignorado", () => {
    const raw = [
      linha(ana),
      linha({ ajuste: ana.whatsapp, pagoPorFora: true }),
      linha({ ...ana, vinculo: "totalpass" }),
      linha({ ajuste: "5500000000000", presente: true }),
      "{quebrada",
    ].join("\n");
    const lista = juntarInscricoes(raw);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ vinculo: "totalpass", pagoPorFora: true });
  });
});
