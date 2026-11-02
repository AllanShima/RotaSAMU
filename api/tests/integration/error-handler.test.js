import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { prisma } from "#db/prisma.js";

describe("tratamento de erros", () => {
  let app;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    app.get("/__boom", () => {
      throw new Error("secret: SELECT * FROM users");
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const post = (headers, payload) =>
    app.inject({ method: "POST", url: "/attendants", headers, payload });

  it("devolve 500 com requestId e sem vazar a mensagem interna", async () => {
    const response = await app.inject({ method: "GET", url: "/__boom" });
    const body = response.json();

    expect(response.statusCode).toBe(500);
    expect(body.message).toBe("Internal server error");
    expect(typeof body.requestId).toBe("string");
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(JSON.stringify(body)).not.toContain("SELECT");
  });

  it("gera um requestId diferente a cada requisição", async () => {
    const [a, b] = await Promise.all([
      app.inject({ method: "GET", url: "/__boom" }),
      app.inject({ method: "GET", url: "/__boom" }),
    ]);

    expect(a.json().requestId).not.toBe(b.json().requestId);
  });

  it("devolve 400 para JSON malformado", async () => {
    const response = await post(
      { "content-type": "application/json" },
      '{"name":',
    );

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty("message");
  });

  it("devolve 400 para corpo vazio com Content-Type JSON", async () => {
    const response = await post({ "content-type": "application/json" }, "");

    expect(response.statusCode).toBe(400);
  });

  it("devolve 415 para Content-Type não suportado", async () => {
    const response = await post({ "content-type": "application/xml" }, "<a/>");

    expect(response.statusCode).toBe(415);
  });

  it("mantém os detalhes nos erros de validação", async () => {
    const response = await post({ "content-type": "application/json" }, "{}");

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe("Validation error");
    expect(response.json().details).toBeDefined();
  });

  it("devolve 404 no formato { message } para rota inexistente", async () => {
    const response = await app.inject({ method: "GET", url: "/nao-existe" });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ message: "Route not found" });
  });
});
