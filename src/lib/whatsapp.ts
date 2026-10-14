// Envio de texto pelo WhatsApp do box (Evolution API). Nunca lança: devolve false em falha.

export async function enviarWhatsapp(numero: string, texto: string): Promise<boolean> {
  const { EVOLUTION_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE } = process.env;
  if (!EVOLUTION_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) return false;

  try {
    const response = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: numero, text: texto }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error(`whatsapp: envio falhou com status ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("whatsapp: envio falhou", error);
    return false;
  }
}
