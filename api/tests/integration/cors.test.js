import { describe, expect, it } from "vitest";

import { useTestApp } from "../helpers.js";

// Igual ao CORS_ORIGIN do vitest.config.js.
const FRONT_END = "http://localhost:3000";

describe("CORS", () => {
  const ctx = useTestApp();

  const preflight = (origin, method) =>
    ctx.app.inject({
      method: "OPTIONS",
      url: "/drivers",
      headers: { origin, "access-control-request-method": method },
    });

  it("libera PATCH no preflight para o front end", async () => {
    const response = await preflight(FRONT_END, "PATCH");

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(FRONT_END);
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
    expect(response.headers["access-control-allow-methods"]).toContain("PATCH");
  });

  it("envia os cabeçalhos de CORS nas respostas normais", async () => {
    const response = await ctx.app.inject({
      method: "GET",
      url: "/drivers",
      headers: { origin: FRONT_END },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(FRONT_END);
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("não libera origens fora da lista", async () => {
    const response = await preflight("http://outro-site.example", "PATCH");

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
