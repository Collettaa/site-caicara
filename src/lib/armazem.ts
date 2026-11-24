import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

// Arquivo JSON no volume /app/data, com fila: dois toques seguidos não perdem um ao outro.
// Mesmo padrão de pendencias.ts.

const pasta = () => process.env.DATA_DIR ?? path.join(process.cwd(), "data");

const filas = new Map<string, Promise<unknown>>();

export function armazem<T>(nome: string, vazio: () => T) {
  const arquivo = () => path.join(pasta(), nome);

  async function ler(): Promise<T> {
    let bruto: string;
    try {
      bruto = await fs.readFile(arquivo(), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return vazio();
      throw error;
    }
    // JSON quebrado lança de propósito: tratar como vazio apagaria tudo na próxima gravação.
    return { ...vazio(), ...(JSON.parse(bruto) as T) };
  }

  async function gravar(dados: T): Promise<void> {
    const destino = arquivo();
    await fs.mkdir(path.dirname(destino), { recursive: true });
    const tmp = `${destino}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(dados, null, 1));
    await fs.rename(tmp, destino);
  }

  function alterar<R>(fn: (dados: T) => R): Promise<R> {
    const anterior = filas.get(nome) ?? Promise.resolve();
    const tarefa = async () => {
      const dados = await ler();
      const r = fn(dados);
      await gravar(dados);
      return r;
    };
    const proximo = anterior.then(tarefa, tarefa);
    filas.set(nome, proximo.catch(() => undefined));
    return proximo;
  }

  return { ler, alterar };
}

export const novoId = () => randomUUID().slice(0, 8);
