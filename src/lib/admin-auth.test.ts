import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assinarSessao, conferirSenha, sessaoValida } from "@/lib/admin-auth";

const DIA = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

beforeEach(() => {
  vi.stubEnv("ADMIN_SENHA", "senha-certa");
  vi.stubEnv("ADMIN_COOKIE_SECRET", "segredo-de-teste");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sessão do admin", () => {
  const agora = new Date("2026-10-14T12:00:00Z");

  it("vale em +29 dias e não em +31", () => {
    const valor = assinarSessao(agora);
    expect(sessaoValida(valor, new Date(agora.getTime() + 29 * DIA))).toBe(true);
    expect(sessaoValida(valor, new Date(agora.getTime() + 31 * DIA))).toBe(false);
  });

  it("hmac adulterado não vale", () => {
    const valor = assinarSessao(agora);
    const ultimo = valor.at(-1);
    const adulterado = valor.slice(0, -1) + (ultimo === "a" ? "b" : "a");
    expect(sessaoValida(adulterado, agora)).toBe(false);
  });

  it("outro segredo não vale", () => {
    const valor = assinarSessao(agora);
    vi.stubEnv("ADMIN_COOKIE_SECRET", "outro-segredo");
    expect(sessaoValida(valor, agora)).toBe(false);
  });

  it("sem cookie ou sem segredo não vale", () => {
    expect(sessaoValida(undefined, agora)).toBe(false);
    expect(sessaoValida("", agora)).toBe(false);
    const valor = assinarSessao(agora);
    vi.stubEnv("ADMIN_COOKIE_SECRET", "");
    expect(sessaoValida(valor, agora)).toBe(false);
  });
});

describe("conferirSenha", () => {
  it("senha certa entra, errada não", () => {
    const agora = new Date("2026-10-14T12:00:00Z");
    expect(conferirSenha("senha-certa", "1.1.1.1", agora)).toBe("ok");
    expect(conferirSenha("senha-errada", "1.1.1.1", agora)).toBe("errada");
  });

  it("5 erros travam por 15 min, mesmo com a senha certa", () => {
    const agora = new Date("2026-10-14T12:00:00Z");
    const ip = "2.2.2.2";
    for (let i = 0; i < 5; i++) expect(conferirSenha("x", ip, agora)).toBe("errada");
    expect(conferirSenha("senha-certa", ip, agora)).toBe("travado");
    expect(conferirSenha("senha-certa", "3.3.3.3", agora)).toBe("ok");
    expect(conferirSenha("senha-certa", ip, new Date(agora.getTime() + 15 * MIN))).toBe("ok");
  });

  it("sem ADMIN_SENHA ou sem ADMIN_COOKIE_SECRET sempre recusa", () => {
    const agora = new Date("2026-10-14T12:00:00Z");
    vi.stubEnv("ADMIN_SENHA", "");
    expect(conferirSenha("", "4.4.4.4", agora)).toBe("errada");
    vi.stubEnv("ADMIN_SENHA", "senha-certa");
    vi.stubEnv("ADMIN_COOKIE_SECRET", "");
    expect(conferirSenha("senha-certa", "5.5.5.5", agora)).toBe("errada");
  });
});
