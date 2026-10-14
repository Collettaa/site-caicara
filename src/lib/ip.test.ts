import { describe, expect, it } from "vitest";
import { ipDoCliente } from "@/lib/ip";

describe("ipDoCliente", () => {
  it("usa o último valor de x-forwarded-for (o que o Traefik acrescenta)", () => {
    const a = new Headers({ "x-forwarded-for": "9.9.9.9, 1.2.3.4" });
    const b = new Headers({ "x-forwarded-for": "8.8.8.8, 7.7.7.7, 1.2.3.4" });
    expect(ipDoCliente(a)).toBe("1.2.3.4");
    expect(ipDoCliente(b)).toBe(ipDoCliente(a));
  });

  it("sem x-forwarded-for usa x-real-ip, senão \"local\"", () => {
    expect(ipDoCliente(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(ipDoCliente(new Headers({ "x-forwarded-for": " , " , "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(ipDoCliente(new Headers())).toBe("local");
  });
});
