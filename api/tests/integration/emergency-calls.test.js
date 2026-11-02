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

describe("PATCH /emergency-calls/:id", () => {
  const ctx = useTestApp();

  const createCall = async () => {
    const attendant = await createAttendant();
    const driver = await createDriver();
    const response = await ctx.app.inject({
      method: "POST",
      url: "/emergency-calls",
      payload: emergencyCallPayload({
        attendantId: attendant.id,
        driverId: driver.id,
      }),
    });
    return response.json();
  };

  const updateCall = (id, payload) =>
    ctx.app.inject({
      method: "PATCH",
      url: `/emergency-calls/${id}`,
      payload,
    });

  it("atualiza os campos informados e preserva os demais", async () => {
    const call = await createCall();

    const response = await updateCall(call.id, {
      returnLocation: "Santa Casa",
      whatHappened: "Atropelamento",
      injuryCondition: "Fratura exposta",
      observations: "Paciente com dor intensa",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.returnLocation).toBe("Santa Casa");
    expect(body.whatHappened).toBe("Atropelamento");
    expect(body.injuryCondition).toBe("Fratura exposta");
    expect(body.observations).toBe("Paciente com dor intensa");
    expect(body.address).toBe(call.address);
    expect(body.protocol).toBe(call.protocol);
  });

  it("aceita atualização parcial", async () => {
    const call = await createCall();

    const response = await updateCall(call.id, { whatHappened: "Engasgo" });

    expect(response.statusCode).toBe(200);
    expect(response.json().whatHappened).toBe("Engasgo");
    expect(response.json().returnLocation).toBe(call.returnLocation);
  });

  it("permite limpar as observações com null", async () => {
    const call = await createCall();
    await updateCall(call.id, { observations: "Algo" });

    const response = await updateCall(call.id, { observations: null });

    expect(response.statusCode).toBe(200);
    expect(response.json().observations).toBeNull();
  });

  it("ignora campos que não podem ser editados", async () => {
    const call = await createCall();

    const response = await updateCall(call.id, {
      whatHappened: "Engasgo",
      protocol: "HACK-0001",
      address: "Outro endereço",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().protocol).toBe(call.protocol);
    expect(response.json().address).toBe(call.address);
  });

  it("devolve 400 para corpo vazio", async () => {
    const call = await createCall();

    const response = await updateCall(call.id, {});

    expect(response.statusCode).toBe(400);
  });

  it("devolve 400 para texto vazio em campo obrigatório", async () => {
    const call = await createCall();

    const response = await updateCall(call.id, { returnLocation: "   " });

    expect(response.statusCode).toBe(400);
  });

  it("devolve 404 para chamado inexistente", async () => {
    const response = await updateCall("00000000-0000-4000-8000-000000000000", {
      whatHappened: "Engasgo",
    });

    expect(response.statusCode).toBe(404);
  });
});
