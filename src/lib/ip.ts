/**
 * IP do cliente atrás do Traefik: ÚLTIMO valor de x-forwarded-for (o proxy acrescenta o IP real
 * no fim; os primeiros o cliente pode inventar), senão x-real-ip, senão "local".
 */
export function ipDoCliente(headers: Headers): string {
  const encaminhado = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return encaminhado.at(-1) || headers.get("x-real-ip")?.trim() || "local";
}
