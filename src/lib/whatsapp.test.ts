import { afterEach, describe, expect, it, vi } from "vitest";
import { enviarWhatsapp } from "@/lib/whatsapp";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("enviarWhatsapp", () => {
  it("espera até 30 s pela Evolution (resposta lenta não vira reenvio)", async () => {
    vi.stubEnv("EVOLUTION_URL", "https://evo.test");
    vi.stubEnv("EVOLUTION_API_KEY", "k");
    vi.stubEnv("EVOLUTION_INSTANCE", "caicara");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 201 })));
    const timeout = vi.spyOn(AbortSignal, "timeout");
    expect(await enviarWhatsapp("5513999990000", "oi")).toBe(true);
    expect(timeout).toHaveBeenCalledWith(30_000);
  });
});
