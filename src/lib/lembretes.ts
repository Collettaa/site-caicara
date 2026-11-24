import { armazem, novoId } from "@/lib/armazem";

// Lembretes que saem no grupo de alunos "Caiçara Fit®🌴💛" pelo número do Gabriel (instância gabs).
// Quem envia é o timer na VPS (scripts/lembretes_grupo.py): a cada 10 min pergunta aqui
// qual é o próximo, manda e avisa que mandou. Nunca pelo número do box (bloqueado em 14/10).

export const GRUPOS_LEMBRETE = { alunos: "Grupo Caiçara Fit (alunos)" } as const;
export type GrupoLembrete = keyof typeof GRUPOS_LEMBRETE;

export type Lembrete = {
  id: string;
  /** "AAAA-MM-DD HH:MM" no horário de São Paulo. */
  quando: string;
  texto: string;
  grupo: GrupoLembrete;
  /** Assunto curto para achar na lista (ex.: "Murph"). */
  assunto?: string;
  enviadoEm?: string;
  /** Passou mais de 3 h da hora (VPS fora): não sai fora de hora. */
  pulado?: boolean;
  erro?: string;
  criadoEm: string;
};

export const ATRASO_MAX_MIN = 180;

export function agoraSP(agora: Date = new Date()): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(agora)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

const minutos = (q: string) => {
  const [d, h] = q.split(" ");
  const [a, m, dia] = d.split("-").map(Number);
  const [hh, mm] = h.split(":").map(Number);
  return Date.UTC(a, m - 1, dia, hh, mm) / 60000;
};

export function quandoValido(data: unknown, hora: unknown): string | null {
  const d = String(data ?? "").trim();
  const h = String(hora ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !/^\d{2}:\d{2}$/.test(h)) return null;
  const [hh, mm] = h.split(":").map(Number);
  if (hh > 23 || mm > 59) return null;
  const [a, m, dia] = d.split("-").map(Number);
  if (new Date(Date.UTC(a, m - 1, dia)).toISOString().slice(0, 10) !== d) return null;
  return `${d} ${h}`;
}

export type Estado = "agendado" | "enviado" | "pulado" | "erro";
export function estadoDe(l: Lembrete): Estado {
  if (l.enviadoEm) return "enviado";
  if (l.pulado) return "pulado";
  if (l.erro) return "erro";
  return "agendado";
}

/** O que a rotina faz agora: pula os muito atrasados e devolve um para mandar (um por vez). */
export function decidir(itens: Lembrete[], agora: string) {
  const vencidos = itens
    .filter((l) => !l.enviadoEm && !l.pulado && l.quando <= agora)
    .sort((a, b) => a.quando.localeCompare(b.quando));
  const pular = vencidos.filter((l) => minutos(agora) - minutos(l.quando) > ATRASO_MAX_MIN);
  const enviar = vencidos.find((l) => !pular.includes(l)) ?? null;
  return { pular: pular.map((l) => l.id), enviar };
}

const loja = armazem<{ lembretes: Lembrete[] }>("lembretes.json", () => ({ lembretes: [] }));

export const listarLembretes = async () =>
  (await loja.ler()).lembretes.sort((a, b) => a.quando.localeCompare(b.quando));

export function salvarLembrete(id: string | null, x: Pick<Lembrete, "quando" | "texto" | "grupo" | "assunto">) {
  return loja.alterar((d) => {
    const atual = id ? d.lembretes.find((l) => l.id === id) : undefined;
    if (atual) {
      Object.assign(atual, x);
      if (!x.assunto) delete atual.assunto;
      // Mudou a hora de um que não saiu: volta a valer.
      if (!atual.enviadoEm) {
        delete atual.pulado;
        delete atual.erro;
      }
      return atual;
    }
    const novo: Lembrete = { ...x, id: novoId(), criadoEm: new Date().toISOString() };
    if (!novo.assunto) delete novo.assunto;
    d.lembretes.push(novo);
    return novo;
  });
}

export function apagarLembrete(id: string) {
  return loja.alterar((d) => {
    d.lembretes = d.lembretes.filter((l) => l.id !== id);
  });
}

/** Chamado pela rotina: marca os pulados e devolve o próximo a mandar. */
export function proximoLembrete(agora: string) {
  return loja.alterar((d) => {
    const { pular, enviar } = decidir(d.lembretes, agora);
    for (const l of d.lembretes) if (pular.includes(l.id)) l.pulado = true;
    return { enviar, pulados: pular.length };
  });
}

export function marcarResultado(id: string, r: { enviadoEm?: string; erro?: string; pulado?: boolean }) {
  return loja.alterar((d) => {
    const l = d.lembretes.find((x) => x.id === id);
    if (!l) return false;
    if (r.enviadoEm) {
      l.enviadoEm = r.enviadoEm;
      delete l.erro;
    }
    if (r.pulado) l.pulado = true;
    if (r.erro) l.erro = r.erro.slice(0, 200);
    return true;
  });
}
