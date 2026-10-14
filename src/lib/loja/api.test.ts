import { afterEach, describe, expect, it, vi } from "vitest";
import { ipDe } from "@/lib/loja/api";

const req = () => new Request("https://caicara.store/api/loja/pedidos", { headers: { "x-forwarded-for": "177.10.20.30" } });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("ipDe", () => {
  it("com LOJA_LOG_IP=1 loga o IP visto (para conferir o Traefik)", () => {
    vi.stubEnv("LOJA_LOG_IP", "1");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const ip = ipDe(req());
    expect(info).toHaveBeenCalledWith("loja: ip", ip);
  });

  it("sem LOJA_LOG_IP não loga", () => {
    vi.stubEnv("LOJA_LOG_IP", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    ipDe(req());
    expect(info).not.toHaveBeenCalled();
  });
});
