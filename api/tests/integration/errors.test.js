import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { createDriver, emergencyCallPayload, useTestApp } from "../helpers.js";

describe("mapeamento de erros do banco", () => {
  const ctx = useTestApp();

  const post = (url, payload) =>
    ctx.app.inject({ method: "POST", url, payload });

  const attendantPayload = {
    name: "Maria",
    email: "maria@example.com",
    password: "senha-segura",
    phone: "14999999999",
  };

  it("devolve 409 quando o e-mail já está cadastrado", async () => {
    const first = await post("/attendants", attendantPayload);
    expect(first.statusCode).toBe(201);

    const second = await post("/attendants", attendantPayload);

    expect(second.statusCode).toBe(409);
    expect(second.json()).toHaveProperty("message");
  });

  it("devolve 422 quando o atendente do chamado não existe", async () => {
    const driver = await createDriver();

    const response = await post(
      "/emergency-calls",
      emergencyCallPayload({
        attendantId: randomUUID(),
        driverId: driver.id,
      }),
    );

    expect(response.statusCode).toBe(422);
  });
});
