import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";

import { fromPrismaError } from "#utils/prisma-errors.js";
import { ServiceUnavailableError } from "#utils/errors.js";

describe("fromPrismaError (banco indisponível)", () => {
  it.each(["P1001", "P1002", "P1008", "P1017", "P2024", "P2028", "P2037"])(
    "mapeia %s para 503",
    (code) => {
      const error = new Prisma.PrismaClientKnownRequestError("falha", {
        code,
        clientVersion: "test",
      });

      const mapped = fromPrismaError(error);

      expect(mapped).toBeInstanceOf(ServiceUnavailableError);
      expect(mapped.statusCode).toBe(503);
      expect(mapped.message).toBe("Database unavailable");
    },
  );

  it("mapeia erro de inicialização do Prisma para 503", () => {
    const error = new Prisma.PrismaClientInitializationError(
      "não conectou",
      "test",
      "P1001",
    );

    expect(fromPrismaError(error).statusCode).toBe(503);
  });

  it("devolve null para erros que não são do Prisma", () => {
    expect(fromPrismaError(new Error("qualquer"))).toBeNull();
  });
});
