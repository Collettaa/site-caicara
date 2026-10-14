// Roda uma vez quando o servidor Next sobe. Liga o verificador da loja só no runtime Node
// (o `iniciarVerificador` ainda ignora o `next build` e os testes).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { iniciarVerificador } = await import("./lib/loja/verificador");
    iniciarVerificador();
  }
}
