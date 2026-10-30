import { prisma } from "#db/prisma.js";
import { NotFoundError } from "#utils/errors.js";

const withoutPassword = ({ password: _, ...rest }) => rest;

// Campos que nunca devem sair da API. Use em toda consulta de usuário cujo
// resultado vira resposta: prisma.user.findMany({ omit: OMIT_PASSWORD }).
export const OMIT_PASSWORD = { password: true };

// Lógica compartilhada entre atendentes e motoristas.

export const updateUser = async ({ id, role, data, include }) => {
  const user = await prisma.user.findFirst({ where: { id, role } });
  if (!user) throw new NotFoundError("User not found");

  const updated = await prisma.user.update({ where: { id }, data, include });
  return withoutPassword(updated);
};

export const setStatus = ({ id, role, status }) =>
  updateUser({ id, role, data: { status } });
