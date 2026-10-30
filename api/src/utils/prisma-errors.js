import { Prisma } from "@prisma/client";

import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from "#utils/errors.js";

// Converte erros conhecidos do Prisma em erros HTTP da aplicação.
// Devolve null se o erro não for um erro conhecido do Prisma — nesse caso o
// error handler continua tratando como 500.
export const fromPrismaError = (error) => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;

  switch (error.code) {
    // Violação de unicidade (e-mail, placa, protocolo...)
    case "P2002": {
      const fields = uniqueFields(error);
      return new ConflictError(
        fields.length
          ? `Already in use: ${fields.join(", ")}`
          : "Record already exists",
      );
    }

    // Chave estrangeira apontando para um registro que não existe
    case "P2003":
      return new UnprocessableEntityError("Referenced record does not exist");

    // Atualização/exclusão de um registro que não existe
    case "P2025":
      return new NotFoundError("Record not found");

    default:
      return null;
  }
};

// Private

// O formato do `meta` varia entre o motor clássico (`meta.target`) e os driver
// adapters do Prisma 7 (`meta.driverAdapterError`). Lemos os dois e, se nenhum
// trouxer os campos, o chamador usa uma mensagem genérica.
const uniqueFields = (error) => {
  const target = error.meta?.target;
  if (Array.isArray(target)) return target;
  if (typeof target === "string") return [target];

  const fields = error.meta?.driverAdapterError?.cause?.constraint?.fields;
  return Array.isArray(fields) ? fields : [];
};
