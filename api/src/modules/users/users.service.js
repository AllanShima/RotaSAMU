import { prisma } from "#db/prisma.js";
import { NotFoundError } from "#utils/errors.js";

const withoutPassword = ({ password: _, ...rest }) => rest;

// Lógica compartilhada entre atendentes e motoristas.

export const updateUser = async ({ id, role, data, include }) => {
  const user = await prisma.user.findFirst({ where: { id, role } });
  if (!user) throw new NotFoundError("User not found");

  const updated = await prisma.user.update({ where: { id }, data, include });
  return withoutPassword(updated);
};

export const setStatus = ({ id, role, status }) =>
  updateUser({ id, role, data: { status } });
