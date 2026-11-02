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

// Com o adapter-pg (Prisma 7), o Postgres informa o nome do índice e o
// `constraint` vem como `{ index }`; só cai em `{ fields }` sem o nome.
// `meta.target` é o formato do motor clássico.
const uniqueFields = (error) => {
  const target = error.meta?.target;
  if (Array.isArray(target)) return target;
  if (typeof target === "string") return [target];

  const constraint = error.meta?.driverAdapterError?.cause?.constraint;
  if (Array.isArray(constraint?.fields)) return constraint.fields;
  if (constraint?.index) {
    return [fieldsFromIndex(constraint.index, error.meta?.table)];
  }
  return [];
};

// "EmergencyCall_protocol_key" -> "protocol"
const fieldsFromIndex = (index, table) => {
  const name = index.replace(/_key$/, "");
  const prefix = `${table ?? name.split("_")[0]}_`;
  return name.startsWith(prefix) ? name.slice(prefix.length) : name;
};
