import { describe, expect, it } from "vitest";

import {
  formatProtocol,
  protocolDate,
} from "#modules/emergency-calls/protocol.js";

describe("protocolDate", () => {
  it("usa a data de Marília (UTC-3), não a de UTC", () => {
    // 22h30 de 02/11 em Marília já é 03/11 em UTC.
    expect(protocolDate(new Date("2026-11-03T01:30:00Z"))).toBe("20261102");
  });

  it("vira o dia à meia-noite de Marília", () => {
    expect(protocolDate(new Date("2026-11-03T02:59:59Z"))).toBe("20261102");
    expect(protocolDate(new Date("2026-11-03T03:00:00Z"))).toBe("20261103");
  });

  it("completa mês e dia com zero", () => {
    expect(protocolDate(new Date("2026-01-05T15:00:00Z"))).toBe("20260105");
  });
});

describe("formatProtocol", () => {
  it("completa o número com zeros até 4 dígitos", () => {
    expect(formatProtocol("20261102", 1)).toBe("20261102-0001");
    expect(formatProtocol("20261102", 42)).toBe("20261102-0042");
  });

  it("não corta números maiores que 4 dígitos", () => {
    expect(formatProtocol("20261102", 12345)).toBe("20261102-12345");
  });
});
