// Cliente HTTP do Asaas v3. Quem chama escolhe a conta: o Aulão usa ASAAS_*, a loja LOJA_ASAAS_*.

export type AsaasCfg = { url: string; apiKey: string };

export const ASAAS_URL_PADRAO = "https://api.asaas.com/v3";

export class ErroAsaas extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ErroAsaas";
  }
}

export async function asaasFetch<T>(cfg: AsaasCfg, pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${cfg.url}${pathname}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "caicara-site",
      access_token: cfg.apiKey,
    },
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ErroAsaas(`asaas ${pathname} ${response.status}: ${await response.text()}`, response.status);
  }
  return response.json() as Promise<T>;
}
