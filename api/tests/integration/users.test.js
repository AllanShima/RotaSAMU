import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { createAttendant, createDriver, useTestApp } from "../helpers.js";

describe("usuários", () => {
  const ctx = useTestApp();

  const get = (url) => ctx.app.inject({ method: "GET", url });
  const patch = (url, payload) =>
    ctx.app.inject({ method: "PATCH", url, payload });

  describe("GET /drivers", () => {
    it("lista os motoristas sem a senha", async () => {
      await createDriver();
      await createDriver();

      const response = await get("/drivers");

      expect(response.statusCode).toBe(200);
      const drivers = response.json();
      expect(drivers).toHaveLength(2);
      drivers.forEach((driver) =>
        expect(driver).not.toHaveProperty("password"),
      );
    });
  });

  describe("GET /drivers/:id", () => {
    it("devolve o motorista com o veículo e sem a senha", async () => {
      const driver = await createDriver({ vehicle: { plate: "ABC1D23" } });

      const response = await get(`/drivers/${driver.id}`);

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(driver.id);
      expect(body.vehicle).toMatchObject({
        plate: "ABC1D23",
        driverId: driver.id,
      });
      expect(body).not.toHaveProperty("password");
    });

    it("devolve 404 para um id que não é de motorista", async () => {
      const attendant = await createAttendant();

      const response = await get(`/drivers/${attendant.id}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe("GET /attendants", () => {
    it("lista apenas atendentes, sem a senha", async () => {
      const attendant = await createAttendant();
      await createDriver();

      const response = await get("/attendants");

      expect(response.statusCode).toBe(200);
      const attendants = response.json();
      expect(attendants).toHaveLength(1);
      expect(attendants[0].id).toBe(attendant.id);
      expect(attendants[0].role).toBe("ATTENDANT");
      expect(attendants[0]).not.toHaveProperty("password");
    });

    it("devolve uma lista vazia quando não há atendentes", async () => {
      const response = await get("/attendants");

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });
  });

  describe("GET /attendants/:id", () => {
    it("devolve o atendente sem a senha", async () => {
      const attendant = await createAttendant();

      const response = await get(`/attendants/${attendant.id}`);

      expect(response.statusCode).toBe(200);
      expect(response.json().id).toBe(attendant.id);
      expect(response.json()).not.toHaveProperty("password");
    });
  });

  describe("PATCH /drivers/:id/status", () => {
    it("atualiza o status do motorista", async () => {
      const driver = await createDriver();
      expect(driver.status).toBe("OFFLINE");

      const online = await patch(`/drivers/${driver.id}/status`, {
        status: "ONLINE",
      });

      expect(online.statusCode).toBe(200);
      expect(online.json().status).toBe("ONLINE");
      expect(online.json()).not.toHaveProperty("password");

      const offline = await patch(`/drivers/${driver.id}/status`, {
        status: "OFFLINE",
      });

      expect(offline.json().status).toBe("OFFLINE");
    });

    it("devolve 404 para um motorista que não existe", async () => {
      const response = await patch(`/drivers/${randomUUID()}/status`, {
        status: "ONLINE",
      });

      expect(response.statusCode).toBe(404);
    });

    it("devolve 404 quando o id é de um atendente", async () => {
      const attendant = await createAttendant();

      const response = await patch(`/drivers/${attendant.id}/status`, {
        status: "ONLINE",
      });

      expect(response.statusCode).toBe(404);
    });

    it("devolve 400 para um status inválido", async () => {
      const driver = await createDriver();

      const response = await patch(`/drivers/${driver.id}/status`, {
        status: "AWAY",
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
