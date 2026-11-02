import { describe, expect, it } from "vitest";

import {
  createAttendant,
  createDriver,
  emergencyCallPayload,
  useTestApp,
} from "../helpers.js";

describe("POST /emergency-calls", () => {
  const ctx = useTestApp();

  const createCall = (payload) =>
    ctx.app.inject({ method: "POST", url: "/emergency-calls", payload });

  it("gera o protocolo no formato AAAAMMDD-NNNN", async () => {
    const attendant = await createAttendant();
    const driver = await createDriver();

    const response = await createCall(
      emergencyCallPayload({ attendantId: attendant.id, driverId: driver.id }),
    );

    expect(response.statusCode).toBe(201);
    expect(response.json().protocol).toMatch(/^\d{8}-0001$/);
  });

  it("aceita vários chamados do mesmo atendente para o mesmo motorista", async () => {
    const attendant = await createAttendant();
    const driver = await createDriver();
    const payload = emergencyCallPayload({
      attendantId: attendant.id,
      driverId: driver.id,
    });

    const first = await createCall(payload);
    const second = await createCall(payload);

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    expect(first.json().protocol).toMatch(/-0001$/);
    expect(second.json().protocol).toMatch(/-0002$/);
  });

  it("ignora um protocolo enviado pelo cliente", async () => {
    const attendant = await createAttendant();
    const driver = await createDriver();

    const response = await createCall(
      emergencyCallPayload({
        attendantId: attendant.id,
        driverId: driver.id,
        protocol: "MEU-PROTOCOLO",
      }),
    );

    expect(response.statusCode).toBe(201);
    expect(response.json().protocol).toMatch(/^\d{8}-0001$/);
  });

  it("não repete protocolo em chamados simultâneos", async () => {
    const attendant = await createAttendant();
    const drivers = await Promise.all([
      createDriver(),
      createDriver(),
      createDriver(),
      createDriver(),
      createDriver(),
    ]);

    const responses = await Promise.all(
      drivers.map((driver) =>
        createCall(
          emergencyCallPayload({
            attendantId: attendant.id,
            driverId: driver.id,
          }),
        ),
      ),
    );

    responses.forEach((response) => expect(response.statusCode).toBe(201));
    const protocols = responses.map((response) => response.json().protocol);
    expect(new Set(protocols).size).toBe(5);
  });

  it("não consome número quando o chamado falha", async () => {
    const attendant = await createAttendant();
    const driver = await createDriver();

    // atendente inexistente: a transação é desfeita
    const failed = await createCall(
      emergencyCallPayload({
        attendantId: "00000000-0000-4000-8000-000000000000",
        driverId: driver.id,
      }),
    );
    const ok = await createCall(
      emergencyCallPayload({ attendantId: attendant.id, driverId: driver.id }),
    );

    expect(failed.statusCode).toBe(422);
    expect(ok.json().protocol).toMatch(/-0001$/);
  });
});
